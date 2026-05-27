"""Audit log routes (superadmin only)."""
from fastapi import APIRouter, Depends


def init_audit_routes(db, require_role):
    """Register audit log endpoints."""
    router = APIRouter()

    @router.get("/audit-logs")
    async def list_audit_logs(
        page: int = 1,
        limit: int = 50,
        action: str = None,
        target_type: str = None,
        actor_user_id: str = None,
        user=Depends(require_role("superadmin")),
    ):
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

    return router
