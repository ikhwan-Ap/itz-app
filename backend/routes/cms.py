"""News, Events, Event Registrations routes."""
from fastapi import APIRouter, Depends, HTTPException

from models import (
    NewsCreate, NewsUpdate,
    EventCreate, EventUpdate, EventRegister,
    uid, now_iso,
)
from core.pagination import paginate_meta


def init_cms_routes(db, current_user, require_role):
    """Register news + events + event registrations endpoints."""
    router = APIRouter()

    # ===== NEWS =====
    @router.get("/news")
    async def list_news(page: int = 1, limit: int = 20, published_only: bool = True):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {"published": True} if published_only else {}
        total = await db.news.count_documents(q)
        items = await db.news.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    @router.post("/news")
    async def create_news(body: NewsCreate, user=Depends(require_role("admin", "superadmin"))):
        doc = {"id": uid(), "author_id": user["id"], "author_name": user.get("name"), "created_at": now_iso(), **body.model_dump()}
        await db.news.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.patch("/news/{nid}")
    async def update_news(nid: str, body: NewsUpdate, user=Depends(require_role("admin", "superadmin"))):
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        if update:
            await db.news.update_one({"id": nid}, {"$set": update})
        return await db.news.find_one({"id": nid}, {"_id": 0})

    @router.delete("/news/{nid}")
    async def delete_news(nid: str, user=Depends(require_role("admin", "superadmin"))):
        await db.news.delete_one({"id": nid})
        return {"message": "deleted"}

    # ===== EVENTS =====
    @router.get("/events")
    async def list_events(page: int = 1, limit: int = 20, published_only: bool = True):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {"published": True} if published_only else {}
        total = await db.events.count_documents(q)
        items = await db.events.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    @router.post("/events")
    async def create_event(body: EventCreate, user=Depends(require_role("admin", "superadmin"))):
        doc = {"id": uid(), "author_id": user["id"], "author_name": user.get("name"), "created_at": now_iso(), **body.model_dump()}
        await db.events.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.patch("/events/{eid}")
    async def update_event(eid: str, body: EventUpdate, user=Depends(require_role("admin", "superadmin"))):
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        if update:
            await db.events.update_one({"id": eid}, {"$set": update})
        return await db.events.find_one({"id": eid}, {"_id": 0})

    @router.delete("/events/{eid}")
    async def delete_event(eid: str, user=Depends(require_role("admin", "superadmin"))):
        await db.events.delete_one({"id": eid})
        await db.event_registrations.delete_many({"event_id": eid})
        return {"message": "deleted"}

    @router.post("/events/{eid}/register")
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

    # ===== EVENT REGISTRATIONS =====
    @router.get("/event-registrations")
    async def list_event_regs(user=Depends(current_user)):
        q = {}
        if user["role"] == "user":
            q = {"user_id": user["id"]}
        elif user["role"] not in ("admin", "superadmin"):
            raise HTTPException(403, "Not allowed")
        return await db.event_registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)

    @router.post("/event-registrations/{rid}/approve")
    async def approve_reg(rid: str, user=Depends(require_role("admin", "superadmin"))):
        await db.event_registrations.update_one({"id": rid}, {"$set": {"status": "approved", "approved_by": user["id"], "approved_at": now_iso()}})
        return {"message": "approved"}

    @router.post("/event-registrations/{rid}/reject")
    async def reject_reg(rid: str, user=Depends(require_role("admin", "superadmin"))):
        await db.event_registrations.update_one({"id": rid}, {"$set": {"status": "rejected", "approved_by": user["id"], "approved_at": now_iso()}})
        return {"message": "rejected"}

    return router
