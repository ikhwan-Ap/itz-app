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
    now_iso, uid,
)
import jwt

# --- Mongo ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="TE Sniper API")
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


def _sanitize_user(u: dict) -> dict:
    if not u:
        return u
    u = dict(u)
    u.pop("_id", None)
    u.pop("password_hash", None)
    u.pop("password2_hash", None)
    return u


# =========================================================
# AUTH
# =========================================================
@api.post("/auth/register")
async def register(body: UserRegister, request: Request, response: Response):
    if body.password != body.password2 and len(body.password2) < 4:
        raise HTTPException(400, "Second password must be at least 4 chars")

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
            vu = datetime.fromisoformat(promo["valid_until"])
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
        exp = datetime.fromisoformat(user["expires_at"])
        if exp < datetime.now(timezone.utc):
            raise HTTPException(403, "Account expired")

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
# USERS (admin)
# =========================================================
@api.get("/users")
async def list_users(user=Depends(require_role("admin", "superadmin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "password2_hash": 0}).sort("created_at", -1).to_list(1000)
    return users


@api.post("/users")
async def admin_create_user(body: AdminCreateUser, user=Depends(require_role("admin", "superadmin"))):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")

    # Role permissions: only superadmin can create admin/superadmin/marketing
    if body.role in ("admin", "superadmin", "marketing") and user["role"] != "superadmin":
        raise HTTPException(403, "Only superadmin can create this role")

    doc = {
        "id": uid(),
        "email": email,
        "password_hash": hash_password(body.password),
        "password2_hash": hash_password(body.password2),
        "name": body.name,
        "role": body.role,
        "association": body.association,
        "status": "active",
        "package_id": body.package_id,
        "expires_at": body.expires_at,
        "max_clicks": body.max_clicks,
        "clicks_used": 0,
        "created_by": user["id"],
        "is_trial": body.is_trial,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return _sanitize_user(doc)


@api.patch("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user=Depends(require_role("admin", "superadmin"))):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "role" in update and update["role"] in ("admin", "superadmin") and user["role"] != "superadmin":
        raise HTTPException(403, "Only superadmin can assign admin/superadmin")
    if not update:
        raise HTTPException(400, "Nothing to update")
    await db.users.update_one({"id": user_id}, {"$set": update})
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
    return u


@api.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(require_role("superadmin"))):
    if user_id == user["id"]:
        raise HTTPException(400, "Cannot delete self")
    await db.users.delete_one({"id": user_id})
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
async def list_promos(user=Depends(current_user)):
    # marketing sees only own; admin/superadmin sees all
    q = {}
    if user["role"] == "marketing":
        q = {"owner_marketing_id": user["id"]}
    elif user["role"] not in ("admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    return await db.promos.find(q, {"_id": 0}).sort("code", 1).to_list(500)


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
async def validate_promo(code: str, package_id: str):
    promo = await db.promos.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(404, "Invalid code")
    pkg = await db.packages.find_one({"id": package_id, "active": True}, {"_id": 0})
    if not pkg:
        raise HTTPException(404, "Invalid package")
    now = datetime.now(timezone.utc)
    if promo.get("valid_until"):
        if datetime.fromisoformat(promo["valid_until"]) < now:
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
async def list_transactions(user=Depends(current_user)):
    q = {}
    if user["role"] == "marketing":
        q = {"marketing_id": user["id"]}
    elif user["role"] == "user":
        q = {"user_id": user["id"]}
    elif user["role"] not in ("admin", "superadmin"):
        raise HTTPException(403, "Not allowed")
    return await db.transactions.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)


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
    return {"message": "rejected"}


# =========================================================
# NEWS
# =========================================================
@api.get("/news")
async def list_news(published_only: bool = True):
    q = {"published": True} if published_only else {}
    return await db.news.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)


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
async def list_events(published_only: bool = True):
    q = {"published": True} if published_only else {}
    evs = await db.events.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return evs


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
async def update_payment_config(body: PaymentConfigUpdate, user=Depends(require_role("superadmin"))):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.payment_config.update_one({"id": "default"}, {"$set": update}, upsert=True)
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
            exp = datetime.fromisoformat(u["expires_at"])
            if exp > now and (exp - now) < timedelta(days=7):
                expiring_soon.append(u)

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
        dt = datetime.fromisoformat(t["created_at"])
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
        dt = datetime.fromisoformat(t["created_at"])
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
async def calc_run(body: CalculatorRunRequest, user=Depends(current_user)):
    # Check expiry / click limits for user role
    if user["role"] == "user":
        if user.get("status") != "active":
            raise HTTPException(403, "Account not active")
        if user.get("expires_at"):
            exp = datetime.fromisoformat(user["expires_at"])
            if exp < datetime.now(timezone.utc):
                raise HTTPException(403, "Package expired")
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
            last_date = datetime.fromisoformat(last).date()
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
async def list_notifications(user=Depends(current_user)):
    cursor = db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(40)
    items = await cursor.to_list(length=40)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread}


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
# STARTUP
# =========================================================
@app.on_event("startup")
async def on_start():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.packages.create_index("id", unique=True)
    await db.promos.create_index("code", unique=True)
    await db.promos.create_index("id", unique=True)
    await db.transactions.create_index("id", unique=True)
    await db.news.create_index("id", unique=True)
    await db.events.create_index("id", unique=True)

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
