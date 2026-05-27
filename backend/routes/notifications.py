"""Notification routes."""
from fastapi import APIRouter, Depends, HTTPException

from core.pagination import paginate_meta


def init_notification_routes(db, current_user):
    """Register notification endpoints."""
    router = APIRouter()

    @router.get("/notifications")
    async def list_notifications(page: int = 1, limit: int = 20, user=Depends(current_user)):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {"user_id": user["id"]}
        total = await db.notifications.count_documents(q)
        items = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
        return {"items": items, "unread": unread, "meta": paginate_meta(page, limit, total)}

    @router.post("/notifications/{nid}/read")
    async def mark_notification_read(nid: str, user=Depends(current_user)):
        res = await db.notifications.update_one(
            {"id": nid, "user_id": user["id"]},
            {"$set": {"read": True}},
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Notification not found")
        return {"ok": True}

    @router.post("/notifications/read-all")
    async def mark_all_read(user=Depends(current_user)):
        await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
        return {"ok": True}

    return router
