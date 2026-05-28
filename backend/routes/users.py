"""User management routes (admin)."""
from fastapi import APIRouter, Depends, HTTPException, Request

from models import AdminCreateUser, UserUpdate, uid, now_iso
from auth import hash_password
from core.pagination import paginate_meta


def init_user_routes(db, require_role, sanitize_user, audit_log):
    """Register user management endpoints."""
    router = APIRouter()

    @router.get("/users")
    async def list_users(
        page: int = 1,
        limit: int = 20,
        search: str = None,
        status: str = None,
        role: str = None,
        user=Depends(require_role("admin", "superadmin")),
    ):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {}
        if status:
            q["status"] = status
        if role:
            q["role"] = role
        if search:
            q["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}},
            ]
        total = await db.users.count_documents(q)
        items = await db.users.find(
            q, {"_id": 0, "password_hash": 0, "password2_hash": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    @router.post("/users")
    async def admin_create_user(body: AdminCreateUser, user=Depends(require_role("admin", "superadmin"))):
        email = body.email.lower()
        if await db.users.find_one({"email": email}):
            raise HTTPException(400, "Email already exists")

        if body.role in ("admin", "superadmin", "marketing") and user["role"] != "superadmin":
            raise HTTPException(403, "Only superadmin can create this role")

        pw2 = body.password2 if body.password2 else body.password

        doc = {
            "id": uid(),
            "email": email,
            "password_hash": hash_password(body.password),
            "password2_hash": hash_password(pw2),
            "name": body.name,
            "role": body.role,
            "association": body.association,
            "status": body.status,
            "package_id": body.package_id,
            "expires_at": body.expires_at if body.expires_at else None,
            "max_clicks": body.max_clicks,
            "max_history": 15,
            "clicks_used": 0,
            "created_by": user["id"],
            "is_trial": body.is_trial,
            "created_at": now_iso(),
        }
        await db.users.insert_one(doc)
        return sanitize_user(doc)

    @router.patch("/users/{user_id}")
    async def update_user(user_id: str, body: UserUpdate, user=Depends(require_role("admin", "superadmin")), request: Request = None):
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        if "role" in update and update["role"] in ("admin", "superadmin") and user["role"] != "superadmin":
            raise HTTPException(403, "Only superadmin can assign admin/superadmin")
        if not update:
            raise HTTPException(400, "Nothing to update")
        before = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})

        # If package_id changed: sync max_clicks from new package + reset clicks_used
        if "package_id" in update and before and update["package_id"] != before.get("package_id"):
            new_pkg = await db.packages.find_one({"id": update["package_id"]}, {"_id": 0})
            if new_pkg:
                if "max_clicks" not in update:
                    update["max_clicks"] = new_pkg.get("max_clicks")
                update["clicks_used"] = 0

        # If status changed to "active": auto-approve pending transactions
        if "status" in update and update["status"] == "active" and before and before.get("status") != "active":
            pending_tx = await db.transactions.find_one({"user_id": user_id, "status": "pending"})
            if pending_tx:
                from models import now_iso
                await db.transactions.update_one(
                    {"id": pending_tx["id"]},
                    {"$set": {"status": "approved", "approved_by": user["id"], "approved_at": now_iso(), "note": "Auto-approved via user status change"}},
                )

        await db.users.update_one({"id": user_id}, {"$set": update})
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
        if "role" in update or "status" in update or "package_id" in update:
            await audit_log(
                actor=user,
                action="user.update",
                target_type="user",
                target_id=user_id,
                request=request,
                metadata={"fields": list(update.keys())},
                before={k: before.get(k) for k in update if before},
                after={k: update[k] for k in update},
            )
        return u

    @router.delete("/users/{user_id}")
    async def delete_user(user_id: str, user=Depends(require_role("superadmin")), request: Request = None):
        if user_id == user["id"]:
            raise HTTPException(400, "Cannot delete self")
        target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password2_hash": 0})
        await db.users.delete_one({"id": user_id})
        await audit_log(
            actor=user,
            action="user.delete",
            target_type="user",
            target_id=user_id,
            request=request,
            metadata={"email": target.get("email") if target else None},
        )
        return {"message": "deleted"}

    return router
