"""TE Sniper Calculator — main FastAPI app."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user_from_db, extract_token,
    check_brute_force, record_failed_login, clear_failed_logins,
    seed_superadmin, get_jwt_secret, JWT_ALGORITHM,
)
from calculator import (
    DRILLS_DB, ROLES_DB, ATTR_GROUPS, ALL_ATTRS,
    FIELD_ALL_ATTRS, GK_ATTR_GROUPS, GK_ALL_ATTRS,
    simulate_sniper,
)
from models import (
    UserRegister, UserLogin, AdminCreateUser, UserUpdate,
    PackageCreate, PackageUpdate,
    PromoCreate, PromoUpdate,
    TransactionApprove, TransactionReject,
    NewsCreate, NewsUpdate,
    EventCreate, EventUpdate, EventRegister,
    PaymentConfigUpdate, CalculatorRunRequest,
    ForgotPasswordRequest, ResetPasswordRequest, AdminResetPasswordRequest,
    TrainingResultSave,
    now_iso, uid,
)
import jwt
import hashlib
import secrets
from collections import defaultdict

# =========================================================
# SIMPLE IN-MEMORY RATE LIMITER (P1-RL-04, P1-RL-05)
# =========================================================
# Lightweight per-IP rate limiter — no Redis needed on small VPS.
# Resets on process restart (acceptable for single-worker Uvicorn).
# Nginx is the primary rate limiter; this is defense-in-depth.
import time as _time

_rate_buckets: dict = defaultdict(lambda: {"count": 0, "window_start": 0.0})
_rate_lock_import = None  # asyncio.Lock created lazily on first use


def _rate_check(key: str, max_requests: int, window_seconds: int) -> bool:
    """
    Returns True if request is allowed, False if rate limit exceeded.
    Uses a fixed window counter per key.
    """
    now = _time.monotonic()
    bucket = _rate_buckets[key]
    if now - bucket["window_start"] >= window_seconds:
        bucket["count"] = 0
        bucket["window_start"] = now
    bucket["count"] += 1
    return bucket["count"] <= max_requests

# --- Mongo ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

_debug = os.environ.get("APP_ENV", "production").lower() != "production"
app = FastAPI(
    title="TE Sniper API",
    docs_url="/docs" if _debug else None,
    redoc_url="/redoc" if _debug else None,
    openapi_url="/openapi.json" if _debug else None,
)
api = APIRouter(prefix="/api")

logger = logging.getLogger("tesniper")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


# =========================================================
# Auth dependency wrappers
# =========================================================
async def current_user(request: Request):
    return await get_current_user_from_db(db, request)


def require_role(*roles):
    async def dep(request: Request):
        u = await get_current_user_from_db(db, request)
        if u.get("role") not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return u
    return dep


def _is_admin(user: dict) -> bool:
    return user.get("role") in ("admin", "superadmin")


def _parse_dt(s: str) -> datetime:
    """Parse ISO datetime string — handles Z suffix for Python 3.10 compat."""
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _sanitize_user(u: dict) -> dict:
    if not u:
        return u
    u = dict(u)
    u.pop("_id", None)
    u.pop("password_hash", None)
    u.pop("password2_hash", None)
    return u


# =========================================================
# PAGINATION HELPER (P1-PG-01)
# =========================================================
def _paginate_meta(page: int, limit: int, total: int) -> dict:
    """Standard pagination meta block."""
    limit = max(1, min(limit, 100))  # clamp 1–100
    page = max(1, page)
    pages = max(1, (total + limit - 1) // limit)
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }


# =========================================================
# AUDIT LOG HELPER (P1-AU)
# =========================================================
async def _audit_log(
    actor: dict,
    action: str,
    target_type: str,
    target_id: str,
    request: Request = None,
    metadata: dict = None,
    before: dict = None,
    after: dict = None,
):
    """Create an audit log entry. Called on sensitive admin/superadmin actions."""
    doc = {
        "id": uid(),
        "actor_user_id": actor.get("id"),
        "actor_email": actor.get("email"),
        "actor_role": actor.get("role"),
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "ip_address": request.client.host if request and request.client else None,
        "user_agent": request.headers.get("user-agent") if request else None,
        "metadata": metadata or {},
        "before": before,
        "after": after,
        "created_at": now_iso(),
    }
    try:
        await db.audit_logs.insert_one(doc)
    except Exception as e:
        # Audit log failure must never break the main operation
        logger.error(f"Audit log insert failed: {e}")


# =========================================================
# AUTH
# =========================================================
@api.post("/auth/register")
async def register(body: UserRegister, request: Request, response: Response):
    if body.password != body.password2:
        raise HTTPException(400, "Password dan 2nd password harus sama")
    if len(body.password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")
    if len(body.password2) < 4:
        raise HTTPException(400, "Second password minimal 4 karakter")

    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email already registered")

    # Validate package
    pkg = await db.packages.find_one({"id": body.package_id, "active": True}, {"_id": 0})
    if not pkg:
        raise HTTPException(400, "Invalid package")

    # Validate promo code (if provided)
    promo = None
    discount = 0.0
    if body.promo_code:
        promo = await db.promos.find_one({"code": body.promo_code.upper(), "active": True}, {"_id": 0})
        if not promo:
            raise HTTPException(400, "Invalid promo code")
        now = datetime.now(timezone.utc)
        if promo.get("valid_until"):
            vu = _parse_dt(promo["valid_until"])
            if vu < now:
                raise HTTPException(400, "Promo code expired")
        if promo.get("max_uses") is not None and promo.get("uses", 0) >= promo["max_uses"]:
            raise HTTPException(400, "Promo code usage limit reached")
        if promo["discount_type"] == "percent":
            discount = pkg["price"] * (promo["discount_value"] / 100.0)
        else:
            discount = promo["discount_value"]
        discount = min(discount, pkg["price"])

    final_amount = max(0.0, pkg["price"] - discount)
    marketing_cut = discount if promo and promo.get("owner_marketing_id") else 0.0

    user_id = uid()
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "password2_hash": hash_password(body.password2),
        "name": body.name,
        "role": "user",
        "association": body.association,
        "status": "pending",  # Wait for admin approval
        "package_id": body.package_id,
        "expires_at": None,
        "max_clicks": pkg.get("max_clicks"),
        "clicks_used": 0,
        "created_by": None,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)

    tx_doc = {
        "id": uid(),
        "user_id": user_id,
        "user_email": email,
        "user_name": body.name,
        "package_id": body.package_id,
        "package_name": pkg["name"],
        "amount": pkg["price"],
        "promo_code": body.promo_code.upper() if body.promo_code else None,
        "discount_amount": discount,
        "final_amount": final_amount,
        "marketing_id": promo.get("owner_marketing_id") if promo else None,
        "marketing_cut": marketing_cut,
        "status": "pending",
        "payment_method": "manual",
        "note": "",
        "approved_by": None,
        "approved_at": None,
        "created_at": now_iso(),
    }
    await db.transactions.insert_one(tx_doc)

    # Notify all admins/superadmins about the new pending registration
    admins = await db.users.find({"role": {"$in": ["admin", "superadmin"]}}, {"id": 1, "_id": 0}).to_list(50)
    for a in admins:
        await _create_notification(
            a["id"],
            "new_transaction",
            "Registrasi Baru Menunggu Approval",
            f"{user_doc['name']} mendaftar dengan paket {pkg['name']}. Total: Rp {int(final_amount):,}".replace(",", "."),
            "/app/admin/transactions",
        )

    return {
        "message": "Registration submitted. Awaiting admin approval.",
        "transaction_id": tx_doc["id"],
        "final_amount": final_amount,
        "discount": discount,
    }


@api.post("/auth/login")
async def login(body: UserLogin, request: Request, response: Response):
    email = body.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    await check_brute_force(db, identifier)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_failed_login(db, identifier)
        raise HTTPException(401, "Invalid email or password")

    if user.get("status") == "pending":
        raise HTTPException(403, "Account pending admin approval")
    if user.get("status") == "suspended":
        raise HTTPException(403, "Account suspended")

    # Check expiry
    if user.get("expires_at"):
        try:
            exp = _parse_dt(user["expires_at"])
            if exp < datetime.now(timezone.utc):
                raise HTTPException(403, "Account expired")
        except (ValueError, TypeError):
            pass  # malformed date — skip expiry check

    await clear_failed_logins(db, identifier)

    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)

    return _sanitize_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    # refresh with package info + expiry details
    pkg = None
    if user.get("package_id"):
        pkg = await db.packages.find_one({"id": user["package_id"]}, {"_id": 0})
    return {**user, "package": pkg}


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(rt, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token")
        u = await db.users.find_one({"id": payload["sub"]})
        if not u:
            raise HTTPException(401, "User not found")
        new_access = create_access_token(u["id"], u["email"], u["role"])
        response.set_cookie("access_token", new_access, httponly=True, secure=True, samesite="none", max_age=43200 * 60, path="/")
        return {"message": "ok"}
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid refresh token")


# =========================================================
# FORGOT / RESET PASSWORD (P1-FP)
# =========================================================
# Schema — db.password_reset_tokens:
#   id             uuid
#   user_id        string   → users.id
#   email          string   (denormalized for audit)
#   token_hash     string   (sha256 of the plaintext token; plaintext never stored)
#   expires_at     ISO datetime (UTC)
#   used           bool
#   created_at     ISO datetime (UTC)
#   used_at        ISO datetime | None
#   ip_address     string   (request IP when requested)
#
# Policy:
#   - Token TTL: 60 minutes
#   - Token is single-use (used=True after reset)
#   - Forgot endpoint never reveals whether email exists (anti-enumeration)
#   - Rate limited per-IP via Nginx api_auth zone (covers /api/auth/*)
#   - On reset: invalidate all existing refresh tokens by changing password_hash
PASSWORD_RESET_TTL_MIN = 60


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, request: Request):
    """
    Request a password reset. Always returns success to prevent email enumeration.
    If the email exists, a reset token is created. In production, a background
    mailer would send the link. For now, the token is logged and returned via
    FRONTEND_URL in the server log.
    """
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"

    user = await db.users.find_one({"email": email})
    if user:
        # Invalidate previous tokens for this user (defense-in-depth)
        await db.password_reset_tokens.update_many(
            {"user_id": user["id"], "used": False},
            {"$set": {"used": True, "used_at": now_iso()}},
        )

        plain_token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TTL_MIN)
        await db.password_reset_tokens.insert_one({
            "id": uid(),
            "user_id": user["id"],
            "email": email,
            "token_hash": _hash_token(plain_token),
            "expires_at": expires.isoformat(),
            "used": False,
            "created_at": now_iso(),
            "used_at": None,
            "ip_address": ip,
        })

        frontend = os.environ.get("FRONTEND_URL", "https://indotimezone.store")
        reset_link = f"{frontend}/reset-password?token={plain_token}"
        # TODO: integrate with email provider. For now, log for ops visibility.
        logger.info(f"[forgot-password] Reset link for {email}: {reset_link}")

    # Always same response regardless of whether user exists
    return {"message": "Jika email terdaftar, link reset password akan dikirim."}


@api.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest, request: Request):
    """Consume a reset token and set a new password."""
    if body.password != body.password2:
        raise HTTPException(400, "Password dan konfirmasi password harus sama")
    if len(body.password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")

    token_hash = _hash_token(body.token)
    rec = await db.password_reset_tokens.find_one({"token_hash": token_hash})
    if not rec:
        raise HTTPException(400, "Token tidak valid atau sudah dipakai")
    if rec.get("used"):
        raise HTTPException(400, "Token sudah pernah dipakai")
    try:
        exp = _parse_dt(rec["expires_at"])
    except (ValueError, TypeError, KeyError):
        raise HTTPException(400, "Token tidak valid")
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Token sudah kedaluwarsa")

    user = await db.users.find_one({"id": rec["user_id"]})
    if not user:
        raise HTTPException(400, "User tidak ditemukan")

    # Update password and mark token used (both inside same logical op)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(body.password)}},
    )
    await db.password_reset_tokens.update_one(
        {"id": rec["id"]},
        {"$set": {"used": True, "used_at": now_iso()}},
    )

    # Clear any brute-force lockouts tied to this user's email
    ip = request.client.host if request.client else "unknown"
    await db.login_attempts.delete_many({"identifier": {"$regex": f":{user['email']}$"}})

    await _audit_log(
        actor={"id": user["id"], "email": user["email"], "role": user.get("role")},
        action="user.password_reset",
        target_type="user",
        target_id=user["id"],
        request=request,
        metadata={"method": "email_token", "ip": ip},
    )

    return {"message": "Password berhasil direset. Silakan login dengan password baru."}


@api.post("/auth/admin-reset-password")
async def admin_reset_password(
    body: AdminResetPasswordRequest,
    request: Request,
    user=Depends(require_role("superadmin")),
):
    """Superadmin fallback — force-reset a user's password. Audit-logged."""
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")
    target = await db.users.find_one({"id": body.user_id})
    if not target:
        raise HTTPException(404, "User tidak ditemukan")

    await db.users.update_one(
        {"id": body.user_id},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    await _audit_log(
        actor=user,
        action="user.admin_password_reset",
        target_type="user",
        target_id=body.user_id,
        request=request,
        metadata={"target_email": target.get("email")},
    )
    return {"message": "Password user berhasil direset"}


# =========================================================
# USERS (admin)
# =========================================================
@api.get("/users")
async def list_users(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    status: str = None,
    role: str = None,
    user=Depends(require_role("admin", "superadmin")),
):
    """List users with pagination, search, and filters. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {}
    if status:
        q["status"] = status
    if role:
        q["role"] = role
    if search:
        q["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    total = await db.users.count_documents(q)
    items = await db.users.find(
        q, {"_id": 0, "password_hash": 0, "password2_hash": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.post("/users")
async def admin_create_user(body: AdminCreateUser, user=Depends(require_role("admin", "superadmin"))):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")

    # Role permissions: only superadmin can create admin/superadmin/marketing
    if body.role in ("admin", "superadmin", "marketing") and user["role"] != "superadmin":
        raise HTTPException(403, "Only superadmin can create this role")

    # password2 defaults to same as password if not provided
    pw2 = body.password2 if body.password2 else body.password

    doc = {
        "id": uid(),
        "email": email,
        "password_hash": hash_password(body.password),
        "password2_hash": hash_password(pw2),
        "name": body.name,
        "role": body.role,
        "association": body.association,
        "status": body.status,
        "package_id": body.package_id,
        "expires_at": body.expires_at if body.expires_at else None,
        "max_clicks": body.max_clicks,
        "clicks_used": 0,
        "created_by": user["id"],
        "is_trial": body.is_trial,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return _sanitize_user(doc)


@api.patch("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user=Depends(require_role("admin", "superadmin")), request: Request = None):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "role" in update and update["role"] in ("admin", "superadmin") and user["role"] != "superadmin":
        raise HTTPException(403, "Only superadmin can assign admin/superadmin")
    if not update:
        raise HTTPException(400, "Nothing to update")
    before = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
    await db.users.update_one({"id": user_id}, {"$set": update})
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
    # Audit log for role/status changes
    if "role" in update or "status" in update:
        await _audit_log(
            actor=user,
            action="user.update",
            target_type="user",
            target_id=user_id,
            request=request,
            metadata={"fields": list(update.keys())},
            before={k: before.get(k) for k in update if before},
            after={k: update[k] for k in update},
        )
    return u


@api.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(require_role("superadmin")), request: Request = None):
    if user_id == user["id"]:
        raise HTTPException(400, "Cannot delete self")
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
    await db.users.delete_one({"id": user_id})
    await _audit_log(
        actor=user,
        action="user.delete",
        target_type="user",
        target_id=user_id,
        request=request,
        metadata={"email": target.get("email") if target else None},
    )
    return {"message": "deleted"}


# =========================================================
# PACKAGES
# =========================================================
@api.get("/packages")
async def list_packages(request: Request):
    # Public: only active; admins see all
    try:
        u = await get_current_user_from_db(db, request)
    except HTTPException:
        u = None
    q = {} if (u and _is_admin(u)) else {"active": True}
    return await db.packages.find(q, {"_id": 0}).sort("price", 1).to_list(200)


@api.post("/packages")
async def create_package(body: PackageCreate, user=Depends(require_role("admin", "superadmin"))):
    doc = {"id": uid(), "created_at": now_iso(), **body.model_dump()}
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/packages/{pkg_id}")
async def update_package(pkg_id: str, body: PackageUpdate, user=Depends(require_role("admin", "superadmin"))):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.packages.update_one({"id": pkg_id}, {"$set": update})
    return await db.packages.find_one({"id": pkg_id}, {"_id": 0})


@api.delete("/packages/{pkg_id}")
async def delete_package(pkg_id: str, user=Depends(require_role("superadmin"))):
    await db.packages.delete_one({"id": pkg_id})
    return {"message": "deleted"}


# =========================================================
# PROMO CODES
# =========================================================
@api.get("/promos")
async def list_promos(
    page: int = 1,
    limit: int = 20,
    user=Depends(current_user),
):
    """List promos with pagination. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {}
    if user["role"] == "marketing":
        q = {"owner_marketing_id": user["id"]}
    elif user["role"] not in ("admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    total = await db.promos.count_documents(q)
    items = await db.promos.find(q, {"_id": 0}).sort("code", 1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.post("/promos")
async def create_promo(body: PromoCreate, user=Depends(current_user)):
    if user["role"] not in ("admin", "superadmin", "marketing"):
        raise HTTPException(403, "Not allowed")
    code = body.code.upper().strip()
    if await db.promos.find_one({"code": code}):
        raise HTTPException(400, "Code already exists")

    owner_id = body.owner_marketing_id
    if user["role"] == "marketing":
        owner_id = user["id"]  # marketing can only create their own codes

    doc = {
        "id": uid(),
        "code": code,
        "discount_type": body.discount_type,
        "discount_value": body.discount_value,
        "max_uses": body.max_uses,
        "valid_until": body.valid_until,
        "owner_marketing_id": owner_id,
        "active": body.active,
        "uses": 0,
        "created_at": now_iso(),
    }
    await db.promos.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/promos/{promo_id}")
async def update_promo(promo_id: str, body: PromoUpdate, user=Depends(current_user)):
    if user["role"] not in ("admin", "superadmin", "marketing"):
        raise HTTPException(403, "Not allowed")
    p = await db.promos.find_one({"id": promo_id})
    if not p:
        raise HTTPException(404, "Not found")
    if user["role"] == "marketing" and p.get("owner_marketing_id") != user["id"]:
        raise HTTPException(403, "Not your promo code")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if user["role"] == "marketing":
        update.pop("owner_marketing_id", None)
    if update:
        await db.promos.update_one({"id": promo_id}, {"$set": update})
    return await db.promos.find_one({"id": promo_id}, {"_id": 0})


@api.delete("/promos/{promo_id}")
async def delete_promo(promo_id: str, user=Depends(require_role("admin", "superadmin"))):
    await db.promos.delete_one({"id": promo_id})
    return {"message": "deleted"}


@api.get("/promos/validate/{code}")
async def validate_promo(code: str, package_id: str, request: Request):
    # Rate limit: 10 req/min per IP (P1-RL-04)
    ip = request.client.host if request.client else "unknown"
    if not _rate_check(f"promo_validate:{ip}", max_requests=10, window_seconds=60):
        raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi dalam 1 menit.")

    promo = await db.promos.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(404, "Invalid code")
    pkg = await db.packages.find_one({"id": package_id, "active": True}, {"_id": 0})
    if not pkg:
        raise HTTPException(404, "Invalid package")
    now = datetime.now(timezone.utc)
    if promo.get("valid_until"):
        if _parse_dt(promo["valid_until"]) < now:
            raise HTTPException(400, "Promo code expired")
    if promo.get("max_uses") is not None and promo.get("uses", 0) >= promo["max_uses"]:
        raise HTTPException(400, "Limit reached")
    if promo["discount_type"] == "percent":
        discount = pkg["price"] * (promo["discount_value"] / 100.0)
    else:
        discount = promo["discount_value"]
    discount = min(discount, pkg["price"])
    return {"discount": discount, "final_amount": max(0, pkg["price"] - discount), "promo_code": promo["code"]}


# =========================================================
# TRANSACTIONS
# =========================================================
@api.get("/transactions")
async def list_transactions(
    page: int = 1,
    limit: int = 20,
    status: str = None,
    user=Depends(current_user),
):
    """List transactions with pagination. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {}
    if user["role"] == "marketing":
        q["marketing_id"] = user["id"]
    elif user["role"] == "user":
        q["user_id"] = user["id"]
    elif user["role"] not in ("admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    if status:
        q["status"] = status
    total = await db.transactions.count_documents(q)
    items = await db.transactions.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.post("/transactions/{tx_id}/approve")
async def approve_tx(tx_id: str, body: TransactionApprove, user=Depends(require_role("admin", "superadmin"))):
    tx = await db.transactions.find_one({"id": tx_id})
    if not tx:
        raise HTTPException(404, "Not found")
    if tx["status"] != "pending":
        raise HTTPException(400, f"Already {tx['status']}")

    pkg = await db.packages.find_one({"id": tx["package_id"]}, {"_id": 0})
    if not pkg:
        raise HTTPException(400, "Package missing")

    now = datetime.now(timezone.utc)
    expires_at = None
    if not pkg.get("is_trial"):
        if pkg.get("duration_type") == "yearly":
            expires_at = (now + timedelta(days=365 * pkg.get("duration_value", 1))).isoformat()
        else:
            expires_at = (now + timedelta(days=30 * pkg.get("duration_value", 1))).isoformat()
    elif pkg.get("duration_value"):
        expires_at = (now + timedelta(days=pkg["duration_value"])).isoformat()

    await db.users.update_one(
        {"id": tx["user_id"]},
        {"$set": {
            "status": "active",
            "package_id": tx["package_id"],
            "expires_at": expires_at,
            "max_clicks": pkg.get("max_clicks"),
            "clicks_used": 0,
        }},
    )
    await db.transactions.update_one(
        {"id": tx_id},
        {"$set": {
            "status": "approved",
            "approved_by": user["id"],
            "approved_at": now_iso(),
            "note": body.note or "",
        }},
    )
    # Increment promo usage if any
    if tx.get("promo_code"):
        await db.promos.update_one({"code": tx["promo_code"]}, {"$inc": {"uses": 1}})

    # Notify the user
    await _create_notification(
        tx["user_id"],
        "transaction_approved",
        "Transaksi Disetujui",
        f"Paket {pkg.get('name', '')} sudah aktif. Selamat berlatih!",
        "/app",
    )
    # Audit log
    await _audit_log(
        actor=user,
        action="transaction.approve",
        target_type="transaction",
        target_id=tx_id,
        request=None,
        metadata={"package": pkg.get("name"), "user_id": tx["user_id"], "note": body.note or ""},
    )
    return {"message": "approved"}


@api.post("/transactions/{tx_id}/reject")
async def reject_tx(tx_id: str, body: TransactionReject, user=Depends(require_role("admin", "superadmin"))):
    tx = await db.transactions.find_one({"id": tx_id})
    if not tx:
        raise HTTPException(404, "Not found")
    if tx["status"] != "pending":
        raise HTTPException(400, f"Already {tx['status']}")
    await db.transactions.update_one(
        {"id": tx_id},
        {"$set": {"status": "rejected", "approved_by": user["id"], "approved_at": now_iso(), "note": body.note or ""}},
    )
    await db.users.update_one({"id": tx["user_id"]}, {"$set": {"status": "rejected"}})
    await _create_notification(
        tx["user_id"],
        "transaction_rejected",
        "Transaksi Ditolak",
        body.note or "Silakan hubungi admin untuk informasi lebih lanjut.",
        "/app",
    )
    # Audit log
    await _audit_log(
        actor=user,
        action="transaction.reject",
        target_type="transaction",
        target_id=tx_id,
        request=None,
        metadata={"user_id": tx["user_id"], "note": body.note or ""},
    )
    return {"message": "rejected"}


# =========================================================
# NEWS
# =========================================================
@api.get("/news")
async def list_news(
    page: int = 1,
    limit: int = 20,
    published_only: bool = True,
):
    """List news with pagination. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {"published": True} if published_only else {}
    total = await db.news.count_documents(q)
    items = await db.news.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.post("/news")
async def create_news(body: NewsCreate, user=Depends(require_role("admin", "superadmin"))):
    doc = {"id": uid(), "author_id": user["id"], "author_name": user.get("name"), "created_at": now_iso(), **body.model_dump()}
    await db.news.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/news/{nid}")
async def update_news(nid: str, body: NewsUpdate, user=Depends(require_role("admin", "superadmin"))):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.news.update_one({"id": nid}, {"$set": update})
    return await db.news.find_one({"id": nid}, {"_id": 0})


@api.delete("/news/{nid}")
async def delete_news(nid: str, user=Depends(require_role("admin", "superadmin"))):
    await db.news.delete_one({"id": nid})
    return {"message": "deleted"}


# =========================================================
# EVENTS
# =========================================================
@api.get("/events")
async def list_events(
    page: int = 1,
    limit: int = 20,
    published_only: bool = True,
):
    """List events with pagination. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {"published": True} if published_only else {}
    total = await db.events.count_documents(q)
    items = await db.events.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.post("/events")
async def create_event(body: EventCreate, user=Depends(require_role("admin", "superadmin"))):
    doc = {"id": uid(), "author_id": user["id"], "author_name": user.get("name"), "created_at": now_iso(), **body.model_dump()}
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/events/{eid}")
async def update_event(eid: str, body: EventUpdate, user=Depends(require_role("admin", "superadmin"))):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.events.update_one({"id": eid}, {"$set": update})
    return await db.events.find_one({"id": eid}, {"_id": 0})


@api.delete("/events/{eid}")
async def delete_event(eid: str, user=Depends(require_role("admin", "superadmin"))):
    await db.events.delete_one({"id": eid})
    await db.event_registrations.delete_many({"event_id": eid})
    return {"message": "deleted"}


@api.post("/events/{eid}/register")
async def register_event(eid: str, body: EventRegister, user=Depends(current_user)):
    ev = await db.events.find_one({"id": eid}, {"_id": 0})
    if not ev:
        raise HTTPException(404, "Event not found")
    if await db.event_registrations.find_one({"event_id": eid, "user_id": user["id"]}):
        raise HTTPException(400, "Already registered")
    doc = {
        "id": uid(),
        "event_id": eid,
        "event_title": ev["title"],
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user["email"],
        "note": body.note or "",
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.event_registrations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/event-registrations")
async def list_event_regs(user=Depends(current_user)):
    q = {}
    if user["role"] == "user":
        q = {"user_id": user["id"]}
    elif user["role"] not in ("admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    return await db.event_registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/event-registrations/{rid}/approve")
async def approve_reg(rid: str, user=Depends(require_role("admin", "superadmin"))):
    await db.event_registrations.update_one({"id": rid}, {"$set": {"status": "approved", "approved_by": user["id"], "approved_at": now_iso()}})
    return {"message": "approved"}


@api.post("/event-registrations/{rid}/reject")
async def reject_reg(rid: str, user=Depends(require_role("admin", "superadmin"))):
    await db.event_registrations.update_one({"id": rid}, {"$set": {"status": "rejected", "approved_by": user["id"], "approved_at": now_iso()}})
    return {"message": "rejected"}


# =========================================================
# PAYMENT CONFIG
# =========================================================
@api.get("/payment-config")
async def get_payment_config(user=Depends(require_role("admin", "superadmin"))):
    cfg = await db.payment_config.find_one({"id": "default"}, {"_id": 0})
    if not cfg:
        cfg = {
            "id": "default",
            "manual_enabled": True,
            "xendit_enabled": False,
            "xendit_api_key": "",
            "xendit_webhook_token": "",
            "midtrans_enabled": False,
            "midtrans_server_key": "",
            "midtrans_client_key": "",
            "bank_info": "",
        }
        await db.payment_config.insert_one(dict(cfg))
        cfg.pop("_id", None)
    return cfg


@api.patch("/payment-config")
async def update_payment_config(body: PaymentConfigUpdate, user=Depends(require_role("superadmin")), request: Request = None):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.payment_config.update_one({"id": "default"}, {"$set": update}, upsert=True)
    await _audit_log(
        actor=user,
        action="payment_config.update",
        target_type="payment_config",
        target_id="default",
        request=request,
        metadata={"fields": list(update.keys())},
    )
    return await db.payment_config.find_one({"id": "default"}, {"_id": 0})


# =========================================================
# DASHBOARD STATS
# =========================================================
@api.get("/dashboard/admin")
async def admin_stats(user=Depends(require_role("admin", "superadmin"))):
    now = datetime.now(timezone.utc)
    all_users = await db.users.find({}, {"_id": 0, "password_hash": 0, "password2_hash": 0}).to_list(10000)
    active_users = [u for u in all_users if u.get("status") == "active"]
    pending_users = [u for u in all_users if u.get("status") == "pending"]
    expiring_soon = []
    for u in active_users:
        if u.get("expires_at"):
            try:
                exp = _parse_dt(u["expires_at"])
                if exp > now and (exp - now) < timedelta(days=7):
                    expiring_soon.append(u)
            except (ValueError, TypeError):
                pass

    txs = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    approved = [t for t in txs if t["status"] == "approved"]
    pending_tx = [t for t in txs if t["status"] == "pending"]

    gross = sum(t["amount"] for t in approved)
    net = sum(t["final_amount"] for t in approved)
    marketing = sum(t.get("marketing_cut", 0) for t in approved)
    discount_total = sum(t.get("discount_amount", 0) for t in approved)

    # revenue by month (last 6 months)
    months = {}
    for t in approved:
        dt = _parse_dt(t["created_at"])
        key = dt.strftime("%Y-%m")
        if key not in months:
            months[key] = {"gross": 0, "net": 0, "marketing": 0, "count": 0}
        months[key]["gross"] += t["amount"]
        months[key]["net"] += t["final_amount"]
        months[key]["marketing"] += t.get("marketing_cut", 0)
        months[key]["count"] += 1

    chart = []
    for i in range(5, -1, -1):
        dt = now - timedelta(days=30 * i)
        key = dt.strftime("%Y-%m")
        m = months.get(key, {"gross": 0, "net": 0, "marketing": 0, "count": 0})
        chart.append({"month": dt.strftime("%b %Y"), **m})

    return {
        "total_users": len(all_users),
        "active_users": len(active_users),
        "pending_users": len(pending_users),
        "expiring_soon": len(expiring_soon),
        "expiring_list": [_sanitize_user(u) for u in expiring_soon][:20],
        "pending_tx_count": len(pending_tx),
        "gross": gross,
        "net": net,
        "marketing_total": marketing,
        "discount_total": discount_total,
        "chart": chart,
        "recent_tx": txs[:10],
    }


@api.get("/dashboard/marketing")
async def marketing_stats(user=Depends(require_role("marketing", "admin", "superadmin"))):
    now = datetime.now(timezone.utc)
    filter_id = user["id"] if user["role"] == "marketing" else None

    q_tx = {"marketing_id": filter_id, "status": "approved"} if filter_id else {"status": "approved", "marketing_id": {"$ne": None}}
    txs = await db.transactions.find(q_tx, {"_id": 0}).sort("created_at", -1).to_list(5000)

    q_promo = {"owner_marketing_id": filter_id} if filter_id else {"owner_marketing_id": {"$ne": None}}
    promos = await db.promos.find(q_promo, {"_id": 0}).to_list(500)

    total_earnings = sum(t.get("marketing_cut", 0) for t in txs)
    total_conversions = len(txs)

    chart = {}
    for t in txs:
        dt = _parse_dt(t["created_at"])
        key = dt.strftime("%Y-%m")
        if key not in chart:
            chart[key] = {"earnings": 0, "count": 0}
        chart[key]["earnings"] += t.get("marketing_cut", 0)
        chart[key]["count"] += 1

    chart_arr = []
    for i in range(5, -1, -1):
        dt = now - timedelta(days=30 * i)
        key = dt.strftime("%Y-%m")
        m = chart.get(key, {"earnings": 0, "count": 0})
        chart_arr.append({"month": dt.strftime("%b %Y"), **m})

    return {
        "total_earnings": total_earnings,
        "total_conversions": total_conversions,
        "active_promos": len([p for p in promos if p.get("active")]),
        "promos": promos,
        "chart": chart_arr,
        "recent_tx": txs[:20],
    }


# =========================================================
# CALCULATOR
# =========================================================
@api.get("/calculator/meta")
async def calc_meta():
    return {
        "drills": DRILLS_DB,
        "roles": ROLES_DB,
        "attrs": ATTR_GROUPS,
        "all_attrs": FIELD_ALL_ATTRS,
        "gk_attrs": GK_ATTR_GROUPS,
        "gk_all_attrs": GK_ALL_ATTRS,
    }


@api.post("/calculator/run")
async def calc_run(body: CalculatorRunRequest, request: Request, user=Depends(current_user)):
    # Rate limit: 20 req/min per user (P1-RL-05)
    rl_key = f"calc_run:{user['id']}"
    if not _rate_check(rl_key, max_requests=20, window_seconds=60):
        raise HTTPException(429, "Terlalu banyak simulasi. Tunggu sebentar.")
    # Check expiry / click limits for user role
    if user["role"] == "user":
        if user.get("status") != "active":
            raise HTTPException(403, "Account not active")
        if user.get("expires_at"):
            try:
                exp = _parse_dt(user["expires_at"])
                if exp < datetime.now(timezone.utc):
                    raise HTTPException(403, "Package expired")
            except (ValueError, TypeError):
                pass
        if user.get("max_clicks") is not None:
            used = user.get("clicks_used", 0)
            if used >= user["max_clicks"]:
                raise HTTPException(403, "Trial click limit reached")

    # Build white-set from roles
    white_set = set()
    for r in body.roles:
        for a in ROLES_DB.get(r, []):
            white_set.add(a)

    # Strip bonus from white attrs (frontend may send visible/bonus-inclusive values)
    init_stats = {}
    for a in ALL_ATTRS:
        val = int(body.stats.get(a, 1))
        if a in white_set:
            val = max(1, val - int(body.bonus or 0))
        init_stats[a] = val

    # Run simulator
    drill_filter = [body.single_drill] if body.single_drill else None
    is_gk = "GK" in body.roles
    result = simulate_sniper(
        init_stats=init_stats,
        white_set=white_set,
        targets=body.targets,
        grey_limit=int(body.grey_limit or 40),
        drill_filter=drill_filter,
        white_multiplier=int(body.white_multiplier or 1),
        valid_attrs=set(GK_ALL_ATTRS) if is_gk else set(FIELD_ALL_ATTRS),
        soft_grey_cap=bool(drill_filter),  # single drill: grey attrs already capped don't block
    )

    # Compute overall %
    score_attrs = GK_ALL_ATTRS if is_gk else FIELD_ALL_ATTRS
    final_vals = {}
    for a in score_attrs:
        v = int(result["stats"].get(a, 1))
        if a in white_set:
            v += int(body.bonus or 0)
        final_vals[a] = v
    total = sum(final_vals.values())
    overall = round(total / 15)

    # Increment click count + streak
    if user["role"] == "user":
        await _update_streak(user["id"])
        await db.users.update_one({"id": user["id"]}, {"$inc": {"clicks_used": 1}})

    return {
        "history": result["history"],
        "final_stats": final_vals,
        "overall": overall,
        "total_cost": result["totalCost"],
        "white_set": list(white_set),
    }


# =========================================================
# TRAINING RESULTS (P2-SR)
# =========================================================
@api.post("/training-results")
async def save_training_result(body: TrainingResultSave, user=Depends(current_user)):
    """Save a calculator result for the authenticated user."""
    if user.get("role") not in ("user", "admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    doc = {
        "id": uid(),
        "user_id": user["id"],
        "user_email": user["email"],
        "mode": body.mode,
        "position": body.position,
        "roles": body.roles,
        "input_stats": body.input_stats,
        "targets": body.targets,
        "grey_limit": body.grey_limit,
        "white_multiplier": body.white_multiplier,
        "final_stats": body.final_stats,
        "overall": body.overall,
        "total_cost": body.total_cost,
        "history": body.history,
        "white_set": body.white_set,
        "note": body.note or "",
        "is_public": False,
        "share_slug": None,
        "shared_count": 0,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.training_results.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/training-results")
async def list_training_results(
    page: int = 1,
    limit: int = 20,
    mode: str = None,
    user=Depends(current_user),
):
    """List training results for the authenticated user (paginated)."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {"user_id": user["id"]}
    if mode:
        q["mode"] = mode
    total = await db.training_results.count_documents(q)
    items = await db.training_results.find(
        q,
        {"_id": 0, "history": 0},  # exclude heavy history from list view
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.get("/training-results/{result_id}")
async def get_training_result(result_id: str, user=Depends(current_user)):
    """Get full detail of a single training result (includes history)."""
    q = {"id": result_id}
    if user["role"] not in ("admin", "superadmin"):
        q["user_id"] = user["id"]
    doc = await db.training_results.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Result tidak ditemukan")
    return doc


@api.patch("/training-results/{result_id}/note")
async def update_result_note(result_id: str, body: dict, user=Depends(current_user)):
    """Update the note on a saved result."""
    note = str(body.get("note", ""))[:500]
    res = await db.training_results.update_one(
        {"id": result_id, "user_id": user["id"]},
        {"$set": {"note": note, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Result tidak ditemukan")
    return {"ok": True}


@api.delete("/training-results/{result_id}")
async def delete_training_result(result_id: str, user=Depends(current_user)):
    """Delete a saved training result (own only, or admin)."""
    q = {"id": result_id}
    if user["role"] not in ("admin", "superadmin"):
        q["user_id"] = user["id"]
    res = await db.training_results.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(404, "Result tidak ditemukan")
    return {"ok": True}


# =========================================================
# STREAK TRACKING
# =========================================================
async def _update_streak(user_id: str):
    """Update user's training streak based on last_training_date."""
    u = await db.users.find_one({"id": user_id})
    if not u:
        return
    today = datetime.now(timezone.utc).date()
    last = u.get("last_training_date")
    last_date = None
    if last:
        try:
            last_date = _parse_dt(last).date()
        except Exception:
            last_date = None

    if last_date == today:
        return  # Already counted today

    current = int(u.get("current_streak", 0) or 0)
    longest = int(u.get("longest_streak", 0) or 0)

    if last_date and (today - last_date).days == 1:
        current += 1
    else:
        current = 1

    if current > longest:
        longest = current

    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "last_training_date": today.isoformat(),
            "current_streak": current,
            "longest_streak": longest,
        }},
    )


# =========================================================
# NOTIFICATIONS
# =========================================================
async def _create_notification(user_id: str, ntype: str, title: str, body: str = "", link: str = ""):
    doc = {
        "id": uid(),
        "user_id": user_id,
        "type": ntype,
        "title": title,
        "body": body,
        "link": link,
        "read": False,
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(doc)
    return doc


@api.get("/notifications")
async def list_notifications(
    page: int = 1,
    limit: int = 20,
    user=Depends(current_user),
):
    """List notifications with pagination. Default limit 20, max 100."""
    limit = max(1, min(limit, 100))
    skip = (max(1, page) - 1) * limit
    q = {"user_id": user["id"]}
    total = await db.notifications.count_documents(q)
    items = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread, "meta": _paginate_meta(page, limit, total)}


@api.post("/notifications/{nid}/read")
async def mark_notification_read(nid: str, user=Depends(current_user)):
    res = await db.notifications.update_one(
        {"id": nid, "user_id": user["id"]},
        {"$set": {"read": True}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Notification not found")
    return {"ok": True}


@api.post("/notifications/read-all")
async def mark_all_read(user=Depends(current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


# =========================================================
# AUDIT LOGS (P1-AU-06) — superadmin only
# =========================================================
@api.get("/audit-logs")
async def list_audit_logs(
    page: int = 1,
    limit: int = 50,
    action: str = None,
    target_type: str = None,
    actor_user_id: str = None,
    user=Depends(require_role("superadmin")),
):
    """List audit logs — superadmin only. Supports pagination and filtering."""
    limit = min(limit, 100)
    skip = (page - 1) * limit
    q = {}
    if action:
        q["action"] = action
    if target_type:
        q["target_type"] = target_type
    if actor_user_id:
        q["actor_user_id"] = actor_user_id

    total = await db.audit_logs.count_documents(q)
    items = await db.audit_logs.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    pages = (total + limit - 1) // limit
    return {
        "items": items,
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1,
        },
    }


# =========================================================
# TRAINING RESULTS (P2-SR / P2-HL)
# =========================================================
@api.post("/training-results")
async def save_training_result(body: TrainingResultSave, user=Depends(current_user)):
    """Save a calculator result for history tracking."""
    doc = {
        "id": uid(),
        "user_id": user["id"],
        "mode": body.mode,
        "position": body.position,
        "roles": body.roles,
        "input_stats": body.input_stats,
        "targets": body.targets,
        "grey_limit": body.grey_limit,
        "white_multiplier": body.white_multiplier,
        "final_stats": body.final_stats,
        "overall": body.overall,
        "total_cost": body.total_cost,
        "history": body.history,
        "white_set": body.white_set,
        "note": body.note or "",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.training_results.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/training-results")
async def list_training_results(
    page: int = 1,
    limit: int = 20,
    mode: str = None,
    user=Depends(current_user),
):
    """List training results for the current user, paginated."""
    limit = min(limit, 100)
    skip = (page - 1) * limit
    q = {"user_id": user["id"]}
    if mode:
        q["mode"] = mode
    total = await db.training_results.count_documents(q)
    items = await db.training_results.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "meta": _paginate_meta(page, limit, total)}


@api.get("/training-results/{result_id}")
async def get_training_result(result_id: str, user=Depends(current_user)):
    """Get a single training result by ID."""
    doc = await db.training_results.find_one({"id": result_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Result not found")
    return doc


@api.patch("/training-results/{result_id}/note")
async def update_training_result_note(result_id: str, body: dict, user=Depends(current_user)):
    """Update the note on a saved result."""
    note = body.get("note", "")
    res = await db.training_results.update_one(
        {"id": result_id, "user_id": user["id"]},
        {"$set": {"note": note, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Result not found")
    return {"ok": True}


@api.delete("/training-results/{result_id}")
async def delete_training_result(result_id: str, user=Depends(current_user)):
    """Delete a saved training result."""
    res = await db.training_results.delete_one({"id": result_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Result not found")
    return {"ok": True}


# =========================================================
# HEALTH CHECK (P1-HC)
# =========================================================
@api.get("/health")
async def health_check():
    """Public health check — returns app status and version info."""
    return {
        "status": "ok",
        "app": "itz-app",
        "env": os.environ.get("APP_ENV", "development"),
        "timestamp": now_iso(),
    }


@api.get("/health/db")
async def health_db():
    """Public DB health check — verifies MongoDB connectivity."""
    try:
        # ping command is lightweight and doesn't require auth
        await client.admin.command("ping")
        # also check our actual DB is accessible
        count = await db.users.estimated_document_count()
        return {
            "status": "ok",
            "db": os.environ.get("DB_NAME", "itz_app"),
            "users_count": count,
            "timestamp": now_iso(),
        }
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        raise HTTPException(503, detail={"status": "error", "message": "Database unavailable"})


# =========================================================
# STARTUP
# =========================================================
@app.on_event("startup")
async def on_start():
    # Indexes — core unique
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.packages.create_index("id", unique=True)
    await db.promos.create_index("code", unique=True)
    await db.promos.create_index("id", unique=True)
    await db.transactions.create_index("id", unique=True)
    await db.news.create_index("id", unique=True)
    await db.events.create_index("id", unique=True)
    # Indexes — query performance (M-03 fix)
    await db.transactions.create_index([("user_id", 1), ("status", 1)])
    await db.transactions.create_index("marketing_id")
    await db.notifications.create_index([("user_id", 1), ("read", 1)])
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.event_registrations.create_index([("event_id", 1), ("user_id", 1)])
    await db.users.create_index([("status", 1), ("role", 1)])
    # Audit logs index
    await db.audit_logs.create_index([("actor_user_id", 1), ("created_at", -1)])
    await db.audit_logs.create_index([("target_type", 1), ("target_id", 1)])
    # Training results index
    await db.training_results.create_index([("user_id", 1), ("created_at", -1)])
    await db.training_results.create_index("id", unique=True)
    # Password reset tokens index (P1-FP)
    await db.password_reset_tokens.create_index("token_hash", unique=True)
    await db.password_reset_tokens.create_index([("user_id", 1), ("used", 1)])
    await db.password_reset_tokens.create_index("expires_at")
    # Training results index (P2-SR)
    await db.training_results.create_index([("user_id", 1), ("created_at", -1)])
    await db.training_results.create_index("id", unique=True)

    await seed_superadmin(db)

    # Seed default packages if none
    if await db.packages.count_documents({}) == 0:
        defaults = [
            {"id": uid(), "name": "Trial Free (7 Days)", "description": "7 hari akses penuh.", "duration_type": "monthly", "duration_value": 0, "price": 0, "features": ["Akses semua drill", "50 kali klik"], "max_clicks": 50, "is_trial": True, "active": True, "created_at": now_iso()},
            {"id": uid(), "name": "Starter Monthly", "description": "1 bulan akses Sniper.", "duration_type": "monthly", "duration_value": 1, "price": 49000, "features": ["Unlimited klik", "Support email"], "max_clicks": None, "is_trial": False, "active": True, "created_at": now_iso()},
            {"id": uid(), "name": "Pro Yearly", "description": "1 tahun akses full + event exclusive.", "duration_type": "yearly", "duration_value": 1, "price": 399000, "features": ["Unlimited klik", "Prioritas event", "Konsultasi"], "max_clicks": None, "is_trial": False, "active": True, "created_at": now_iso()},
        ]
        await db.packages.insert_many(defaults)

    # Seed default promo
    if await db.promos.count_documents({}) == 0:
        await db.promos.insert_one({
            "id": uid(),
            "code": "WELCOME20",
            "discount_type": "percent",
            "discount_value": 20,
            "max_uses": 100,
            "valid_until": None,
            "owner_marketing_id": None,
            "active": True,
            "uses": 0,
            "created_at": now_iso(),
        })

    logger.info("Startup complete — superadmin seeded")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# mount router
app.include_router(api)

# CORS — frontend domain w/ credentials
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
cors_origins = os.environ.get("CORS_ORIGINS", frontend_url).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else [frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
