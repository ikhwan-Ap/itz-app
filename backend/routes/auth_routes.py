"""Auth routes (register, login, logout, me, refresh, forgot/reset password)."""
import os
import logging
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response

import jwt
from models import (
    UserRegister, UserLogin, UpgradePackageRequest,
    ForgotPasswordRequest, ResetPasswordRequest, AdminResetPasswordRequest,
    uid, now_iso,
)
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies,
    check_brute_force, record_failed_login, clear_failed_logins,
    get_jwt_secret, JWT_ALGORITHM,
)
from core.notify import create_notification
from core.expiry import maybe_warn_expiry
from core.turnstile import verify_turnstile

logger = logging.getLogger("tesniper")
PASSWORD_RESET_TTL_MIN = 60


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def init_auth_routes(db, current_user, require_role, rate_check, parse_dt, sanitize_user, audit_log, create_notif_local):
    """Register auth endpoints."""
    router = APIRouter()

    @router.post("/auth/register")
    async def register(body: UserRegister, request: Request, response: Response):
        ip = request.client.host if request.client else "unknown"
        if not rate_check(f"register:{ip}", max_requests=3, window_seconds=600):
            raise HTTPException(429, "Terlalu banyak percobaan registrasi. Coba lagi dalam 10 menit.")
        if not await verify_turnstile(body.turnstile_token, ip):
            logger.warning(f"Turnstile failed for register: {ip} {body.email} (lenient mode, allowing)")
        if body.password != body.password2:
            raise HTTPException(400, "Password dan 2nd password harus sama")
        if len(body.password) < 6:
            raise HTTPException(400, "Password minimal 6 karakter")
        if len(body.password2) < 4:
            raise HTTPException(400, "Second password minimal 4 karakter")

        email = body.email.lower()
        existing = await db.users.find_one({"email": email})
        if existing:
            # Allow re-register if previous registration is unpaid + stale (>30 min)
            # OR cancel the old pending registration if user wants to retry
            if existing.get("status") == "pending":
                # Check if there's any successful payment
                paid = await db.payments.find_one({"user_id": existing["id"], "status": "paid"})
                if paid:
                    raise HTTPException(400, "Email sudah terdaftar dan sudah membayar. Silakan login.")

                # Check stale (created > 30 min ago)
                from datetime import timedelta
                try:
                    created = datetime.fromisoformat(existing.get("created_at", "").replace("Z", "+00:00"))
                    age_min = (datetime.now(timezone.utc) - created).total_seconds() / 60
                except Exception:
                    age_min = 9999

                if age_min < 30:
                    raise HTTPException(400, f"Email ini sudah didaftarkan {int(age_min)} menit lalu. Tunggu {30 - int(age_min)} menit untuk daftar ulang, atau lanjutkan pembayaran sebelumnya.")

                # Stale: cleanup old data
                await db.users.delete_one({"id": existing["id"]})
                await db.transactions.delete_many({"user_id": existing["id"]})
                await db.payments.delete_many({"user_id": existing["id"]})
            else:
                raise HTTPException(400, "Email sudah terdaftar")

        pkg = await db.packages.find_one({"id": body.package_id, "active": True}, {"_id": 0})
        if not pkg:
            raise HTTPException(400, "Invalid package")

        promo = None
        discount = 0.0
        if body.promo_code:
            promo = await db.promos.find_one({"code": body.promo_code.upper(), "active": True}, {"_id": 0})
            if not promo:
                raise HTTPException(400, "Invalid promo code")
            if not promo.get("package_id"):
                raise HTTPException(400, "Promo code belum di-assign ke paket. Hubungi admin.")
            if promo["package_id"] != body.package_id:
                raise HTTPException(400, "Promo code tidak berlaku untuk paket ini")
            now = datetime.now(timezone.utc)
            if promo.get("valid_until"):
                vu = parse_dt(promo["valid_until"])
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

        # Trial / free package: auto-activate (no admin approval needed)
        is_trial_or_free = pkg.get("is_trial") or final_amount == 0
        from datetime import timedelta
        trial_expires_at = None
        if is_trial_or_free and pkg.get("duration_value"):
            days = pkg["duration_value"] if pkg.get("is_trial") else (
                30 * pkg["duration_value"] if pkg.get("duration_type") != "yearly" else 365 * pkg["duration_value"]
            )
            trial_expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

        user_id = uid()
        user_doc = {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(body.password),
            "password2_hash": hash_password(body.password2),
            "name": body.name,
            "role": "user",
            "association": body.association,
            "status": "active" if is_trial_or_free else "pending",
            "package_id": body.package_id,
            "expires_at": trial_expires_at,
            "max_clicks": pkg.get("max_clicks"),
            "max_history": 15,
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
            "status": "approved" if is_trial_or_free else "pending",
            "payment_method": "trial" if is_trial_or_free else "manual",
            "note": "Auto-approved (trial/free)" if is_trial_or_free else "",
            "approved_by": "system" if is_trial_or_free else None,
            "approved_at": now_iso() if is_trial_or_free else None,
            "created_at": now_iso(),
        }
        await db.transactions.insert_one(tx_doc)

        if not is_trial_or_free:
            admins = await db.users.find({"role": {"$in": ["admin", "superadmin"]}}, {"id": 1, "_id": 0}).to_list(50)
            for a in admins:
                await create_notif_local(
                    a["id"],
                    "new_transaction",
                    "Registrasi Baru Menunggu Pembayaran",
                    f"{user_doc['name']} mendaftar dengan paket {pkg['name']}. Total: Rp {int(final_amount):,}".replace(",", "."),
                    "/app/admin/transactions",
                )

        return {
            "message": "Registration submitted. Awaiting admin approval.",
            "transaction_id": tx_doc["id"],
            "final_amount": final_amount,
            "discount": discount,
        }

    @router.post("/auth/upgrade-package")
    async def upgrade_package(body: UpgradePackageRequest, request: Request, user=Depends(current_user)):
        """Existing user upgrades or renews their package. Creates a pending transaction for admin approval."""
        ip = request.client.host if request.client else "unknown"
        if not rate_check(f"upgrade:{ip}", max_requests=5, window_seconds=600):
            raise HTTPException(429, "Terlalu banyak percobaan upgrade. Coba lagi dalam 10 menit.")

        if user.get("role") != "user":
            raise HTTPException(403, "Hanya user biasa yang bisa upgrade paket")

        # Check no pending transaction already
        pending = await db.transactions.find_one({"user_id": user["id"], "status": "pending"})
        if pending:
            raise HTTPException(400, "Anda sudah punya transaksi pending. Tunggu approval admin atau hubungi admin untuk membatalkan.")

        # Validate package
        pkg = await db.packages.find_one({"id": body.package_id, "active": True}, {"_id": 0})
        if not pkg:
            raise HTTPException(400, "Paket tidak valid")
        if pkg.get("is_trial"):
            raise HTTPException(400, "Tidak bisa upgrade ke paket trial")

        # Validate promo code (if provided)
        promo = None
        discount = 0.0
        if body.promo_code:
            promo = await db.promos.find_one({"code": body.promo_code.upper(), "active": True}, {"_id": 0})
            if not promo:
                raise HTTPException(400, "Invalid promo code")
            if not promo.get("package_id"):
                raise HTTPException(400, "Promo code belum di-assign ke paket. Hubungi admin.")
            if promo["package_id"] != body.package_id:
                raise HTTPException(400, "Promo code tidak berlaku untuk paket ini")
            now = datetime.now(timezone.utc)
            if promo.get("valid_until"):
                vu = parse_dt(promo["valid_until"])
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

        # Determine if this is renewal (same package) or upgrade (different package)
        is_renewal = user.get("package_id") == body.package_id
        tx_type = "renewal" if is_renewal else "upgrade"

        tx_doc = {
            "id": uid(),
            "user_id": user["id"],
            "user_email": user["email"],
            "user_name": user.get("name"),
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
            "tx_type": tx_type,
            "previous_package_id": user.get("package_id"),
            "note": "",
            "approved_by": None,
            "approved_at": None,
            "created_at": now_iso(),
        }
        await db.transactions.insert_one(tx_doc)

        # Notify admins
        admins = await db.users.find({"role": {"$in": ["admin", "superadmin"]}}, {"id": 1, "_id": 0}).to_list(50)
        action_label = "Perpanjang" if is_renewal else "Upgrade"
        for a in admins:
            await create_notif_local(
                a["id"],
                "new_transaction",
                f"{action_label} Paket Menunggu Approval",
                f"{user.get('name', user['email'])} {action_label.lower()} ke {pkg['name']}. Total: Rp {int(final_amount):,}".replace(",", "."),
                "/app/admin/transactions",
            )

        return {
            "message": f"Permintaan {action_label.lower()} berhasil dikirim. Menunggu approval admin.",
            "transaction_id": tx_doc["id"],
            "tx_type": tx_type,
            "final_amount": final_amount,
            "discount": discount,
        }

    @router.post("/auth/login")
    async def login(body: UserLogin, request: Request, response: Response):
        email = body.email.lower()
        ip = request.client.host if request.client else "unknown"
        if not await verify_turnstile(body.turnstile_token, ip):
            logger.warning(f"Turnstile failed for login: {ip} {email} (lenient mode, allowing)")
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

        if user.get("expires_at"):
            try:
                exp = parse_dt(user["expires_at"])
                if exp < datetime.now(timezone.utc):
                    raise HTTPException(403, "Account expired")
            except (ValueError, TypeError):
                pass

        await clear_failed_logins(db, identifier)

        access = create_access_token(user["id"], user["email"], user["role"])
        refresh = create_refresh_token(user["id"])
        set_auth_cookies(response, access, refresh)

        await maybe_warn_expiry(db, user, parse_dt)
        return sanitize_user(user)

    @router.post("/auth/logout")
    async def logout(response: Response):
        clear_auth_cookies(response)
        return {"message": "Logged out"}

    @router.get("/auth/me")
    async def me(user=Depends(current_user)):
        pkg = None
        if user.get("package_id"):
            pkg = await db.packages.find_one({"id": user["package_id"]}, {"_id": 0})
        await maybe_warn_expiry(db, user, parse_dt)
        return {**user, "package": pkg}

    @router.post("/auth/refresh")
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

    @router.post("/auth/forgot-password")
    async def forgot_password(body: ForgotPasswordRequest, request: Request):
        email = body.email.lower().strip()
        ip = request.client.host if request.client else "unknown"

        user = await db.users.find_one({"email": email})
        if user:
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
            logger.info(f"[forgot-password] Reset link for {email}: {reset_link}")

        return {"message": "Jika email terdaftar, link reset password akan dikirim."}

    @router.post("/auth/reset-password")
    async def reset_password(body: ResetPasswordRequest, request: Request):
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
            exp = parse_dt(rec["expires_at"])
        except (ValueError, TypeError, KeyError):
            raise HTTPException(400, "Token tidak valid")
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Token sudah kedaluwarsa")

        user = await db.users.find_one({"id": rec["user_id"]})
        if not user:
            raise HTTPException(400, "User tidak ditemukan")

        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"password_hash": hash_password(body.password)}},
        )
        await db.password_reset_tokens.update_one(
            {"id": rec["id"]},
            {"$set": {"used": True, "used_at": now_iso()}},
        )

        ip = request.client.host if request.client else "unknown"
        await db.login_attempts.delete_many({"identifier": {"$regex": f":{user['email']}$"}})

        await audit_log(
            actor={"id": user["id"], "email": user["email"], "role": user.get("role")},
            action="user.password_reset",
            target_type="user",
            target_id=user["id"],
            request=request,
            metadata={"method": "email_token", "ip": ip},
        )

        return {"message": "Password berhasil direset. Silakan login dengan password baru."}

    @router.post("/auth/admin-reset-password")
    async def admin_reset_password(
        body: AdminResetPasswordRequest,
        request: Request,
        user=Depends(require_role("superadmin")),
    ):
        if len(body.new_password) < 6:
            raise HTTPException(400, "Password minimal 6 karakter")
        target = await db.users.find_one({"id": body.user_id})
        if not target:
            raise HTTPException(404, "User tidak ditemukan")

        await db.users.update_one(
            {"id": body.user_id},
            {"$set": {"password_hash": hash_password(body.new_password)}},
        )
        await audit_log(
            actor=user,
            action="user.admin_password_reset",
            target_type="user",
            target_id=body.user_id,
            request=request,
            metadata={"target_email": target.get("email")},
        )
        return {"message": "Password user berhasil direset"}

    return router
