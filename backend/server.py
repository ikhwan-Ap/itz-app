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
# AUTH — extracted to routes/auth_routes.py
# =========================================================
from routes.auth_routes import init_auth_routes
auth_router = init_auth_routes(db, current_user, require_role, _rate_check, _parse_dt, _sanitize_user, _audit_log, _create_notification)
api.include_router(auth_router)


# =========================================================
# USERS — extracted to routes/users.py
# =========================================================
from routes.users import init_user_routes
user_router = init_user_routes(db, require_role, _sanitize_user, _audit_log)
api.include_router(user_router)


# =========================================================
# PACKAGES — extracted to routes/packages.py
# =========================================================
from routes.packages import init_package_routes
pkg_router = init_package_routes(db, require_role, _is_admin)
api.include_router(pkg_router)


# =========================================================
# PROMO CODES
# =========================================================
# PROMOS — extracted to routes/promos.py
# =========================================================
from routes.promos import init_promo_routes
promo_router = init_promo_routes(db, current_user, require_role, _rate_check, _parse_dt)
api.include_router(promo_router)


# =========================================================
# TRANSACTIONS — extracted to routes/transactions.py
# =========================================================
from routes.transactions import init_transaction_routes
tx_router = init_transaction_routes(db, current_user, require_role, _audit_log)
api.include_router(tx_router)


# =========================================================
# NEWS / EVENTS / EVENT-REGISTRATIONS — extracted to routes/cms.py
# =========================================================
from routes.cms import init_cms_routes
cms_router = init_cms_routes(db, current_user, require_role)
api.include_router(cms_router)


# =========================================================
# PAYMENT CONFIG — extracted to routes/payment_config.py
# =========================================================
from routes.payment_config import init_payment_config_routes
payment_router = init_payment_config_routes(db, require_role, _audit_log)
api.include_router(payment_router)


# =========================================================
# DASHBOARD STATS — extracted to routes/dashboard.py
# =========================================================
from routes.dashboard import init_dashboard_routes
dashboard_router = init_dashboard_routes(db, require_role, current_user, _parse_dt, _sanitize_user)
api.include_router(dashboard_router)


# =========================================================
# CALCULATOR — extracted to routes/calculator.py
# =========================================================
from routes.calculator import init_calculator_routes
from core.streak import update_streak as _streak_update

async def _update_streak(user_id: str):
    """Wrapper for streak update with bound db + parse_dt."""
    return await _streak_update(db, user_id, _parse_dt)

calc_router = init_calculator_routes(db, current_user, _rate_check, _parse_dt, _update_streak)
api.include_router(calc_router)


# =========================================================
# TRAINING RESULTS — extracted to routes/training.py
# =========================================================
from routes.training import init_training_routes
training_router = init_training_routes(db, current_user)
api.include_router(training_router)



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


# =========================================================
# NOTIFICATIONS — extracted to routes/notifications.py
# =========================================================
from routes.notifications import init_notification_routes
notif_router = init_notification_routes(db, current_user)
api.include_router(notif_router)


# =========================================================
# AUDIT LOGS — extracted inline (1 endpoint, keep simple)
# =========================================================
from routes.audit_logs import init_audit_routes
audit_router = init_audit_routes(db, require_role)
api.include_router(audit_router)


# =========================================================
# HEALTH CHECK — extracted to routes/health.py
# =========================================================
from routes.health import init_health_routes
health_router = init_health_routes(client, db)
api.include_router(health_router)


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
