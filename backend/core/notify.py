"""Notification helper — used across multiple routes."""
from models import uid, now_iso


async def create_notification(db, user_id: str, ntype: str, title: str, body: str = "", link: str = ""):
    """Insert a notification document for a user. Returns the doc."""
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
