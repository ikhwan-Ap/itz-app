"""Pydantic models for TE Sniper."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid.uuid4())


# ========== USER ==========
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    password2: str
    name: str
    association: Optional[str] = None
    package_id: str
    promo_code: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """Public endpoint — request a password reset link."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Public endpoint — submit reset with token."""
    token: str
    password: str
    password2: str


class AdminResetPasswordRequest(BaseModel):
    """Superadmin fallback — force reset a user password without email flow."""
    user_id: str
    new_password: str


class UpgradePackageRequest(BaseModel):
    """Upgrade or renew a user's package (existing user picks new package)."""
    package_id: str
    promo_code: Optional[str] = None


class AdminCreateUser(BaseModel):
    email: EmailStr
    password: str
    password2: Optional[str] = None  # Optional; defaults to same as password
    name: str
    role: str = "user"  # user / marketing / admin / superadmin
    association: Optional[str] = None
    package_id: Optional[str] = None
    expires_at: Optional[str] = None  # ISO
    max_clicks: Optional[int] = None
    status: str = "active"
    is_trial: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = None
    association: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    expires_at: Optional[str] = None
    max_clicks: Optional[int] = None
    max_history: Optional[int] = None
    package_id: Optional[str] = None


# ========== PACKAGE ==========
class PackageCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    duration_type: str = "monthly"  # monthly / yearly
    duration_value: int = 1
    price: float = 0
    features: List[str] = []
    max_clicks: Optional[int] = None
    is_trial: bool = False
    active: bool = True


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_type: Optional[str] = None
    duration_value: Optional[int] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    max_clicks: Optional[int] = None
    is_trial: Optional[bool] = None
    active: Optional[bool] = None


# ========== PROMO CODE ==========
class PromoCreate(BaseModel):
    code: str
    discount_type: str = "percent"  # percent / flat
    discount_value: float = 0
    max_uses: Optional[int] = None
    valid_until: Optional[str] = None  # ISO
    package_id: str  # REQUIRED — promo must be tied to a package
    owner_marketing_id: Optional[str] = None  # superadmin assigns marketing attribution
    active: bool = True


class PromoUpdate(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    max_uses: Optional[int] = None
    valid_until: Optional[str] = None
    package_id: Optional[str] = None
    owner_marketing_id: Optional[str] = None
    active: Optional[bool] = None


# ========== TRANSACTION ==========
class TransactionApprove(BaseModel):
    note: Optional[str] = ""


class TransactionReject(BaseModel):
    note: Optional[str] = ""


# ========== NEWS / EVENTS ==========
class NewsCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    published: bool = True


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    published: Optional[bool] = None


class EventCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    event_date: Optional[str] = None
    registration_required: bool = True
    published: bool = True


class EventUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    event_date: Optional[str] = None
    registration_required: Optional[bool] = None
    published: Optional[bool] = None


class EventRegister(BaseModel):
    note: Optional[str] = ""


# ========== PAYMENT CONFIG ==========
class PaymentConfigUpdate(BaseModel):
    manual_enabled: Optional[bool] = None
    xendit_enabled: Optional[bool] = None
    xendit_api_key: Optional[str] = None
    xendit_webhook_token: Optional[str] = None
    midtrans_enabled: Optional[bool] = None
    midtrans_server_key: Optional[str] = None
    midtrans_client_key: Optional[str] = None
    bank_info: Optional[str] = None


# ========== CALCULATOR ==========
class CalculatorRunRequest(BaseModel):
    roles: List[str]
    stats: Dict[str, float]  # current visible values (lenient: accept float, coerced to int internally)
    bonus: float = 0
    grey_limit: float = 40
    targets: List[Dict[str, Any]]  # [{name, goal, prio}]
    single_drill: Optional[str] = None  # drill name OR None
    player_age: Optional[float] = 18
    white_multiplier: float = 1  # how many points white attrs gain per grey unit (1=equal, 2=double)


# ========== TRAINING RESULTS (P2-SR) ==========
class TrainingResultSave(BaseModel):
    """Payload to save a calculator result. Lenient typing for frontend flexibility."""
    model_config = ConfigDict(extra="ignore")

    mode: str = "full"                    # full / single / gk
    title: Optional[str] = None           # custom session name (NEW: user-friendly label)
    position: Optional[str] = None        # e.g. "MC, ST"
    roles: List[str] = []
    input_stats: Dict[str, Any] = {}
    targets: List[Dict[str, Any]] = []
    grey_limit: float = 40                # accept float to avoid pydantic strict errors
    white_multiplier: float = 1
    final_stats: Dict[str, Any] = {}
    overall: float = 0
    total_cost: float = 0                 # calculator returns fractional cost
    history: List[Dict[str, Any]] = []
    white_set: List[str] = []
    note: Optional[str] = ""
