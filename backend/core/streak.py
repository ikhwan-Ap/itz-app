"""Streak tracking helper."""
from datetime import datetime, timezone


async def update_streak(db, user_id: str, parse_dt):
    """Update user's training streak based on last_training_date."""
    u = await db.users.find_one({"id": user_id})
    if not u:
        return
    today = datetime.now(timezone.utc).date()
    last = u.get("last_training_date")
    last_date = None
    if last:
        try:
            last_date = parse_dt(last).date()
        except Exception:
            last_date = None

    if last_date == today:
        return

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
