"""Expiry warning helper — creates notification if user's package expiring soon."""
from datetime import datetime, timezone, timedelta
from core.notify import create_notification


async def maybe_warn_expiry(db, user, parse_dt):
    """Check if user's package is expiring soon. Create a notification at most once per day."""
    if not user or user.get("role") != "user":
        return
    expires_at = user.get("expires_at")
    if not expires_at:
        return

    try:
        exp = parse_dt(expires_at)
    except (ValueError, TypeError):
        return

    now = datetime.now(timezone.utc)
    days_left = (exp - now).days

    # Only warn if 0 <= days_left <= 7 (already-expired handled separately)
    if days_left < 0:
        # Expired — notify once
        existing = await db.notifications.find_one({
            "user_id": user["id"],
            "type": "package_expired",
        })
        if not existing:
            await create_notification(
                db,
                user["id"],
                "package_expired",
                "Paket sudah berakhir",
                "Paket Anda sudah habis. Silakan perpanjang untuk lanjut latihan.",
                "/app/upgrade",
            )
        return

    if days_left > 7:
        return

    # Check if we already warned today
    today_iso = now.date().isoformat()
    existing = await db.notifications.find_one({
        "user_id": user["id"],
        "type": "package_expiring",
        "created_at": {"$gte": today_iso},
    })
    if existing:
        return

    label = "hari ini" if days_left == 0 else f"{days_left} hari lagi"
    await create_notification(
        db,
        user["id"],
        "package_expiring",
        "Paket akan berakhir",
        f"Paket Anda akan berakhir {label}. Perpanjang sekarang untuk akses tanpa putus.",
        "/app/upgrade",
    )
