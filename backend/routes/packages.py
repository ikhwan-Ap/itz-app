"""Package routes."""
from fastapi import APIRouter, Depends, HTTPException, Request

from models import PackageCreate, PackageUpdate, uid, now_iso
from auth import get_current_user_from_db


def init_package_routes(db, require_role, is_admin):
    """Register package endpoints."""
    router = APIRouter()

    @router.get("/packages")
    async def list_packages(request: Request):
        try:
            u = await get_current_user_from_db(db, request)
        except HTTPException:
            u = None
        q = {} if (u and is_admin(u)) else {"active": True}
        return await db.packages.find(q, {"_id": 0}).sort("price", 1).to_list(200)

    @router.post("/packages")
    async def create_package(body: PackageCreate, user=Depends(require_role("admin", "superadmin"))):
        doc = {"id": uid(), "created_at": now_iso(), **body.model_dump()}
        await db.packages.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.patch("/packages/{pkg_id}")
    async def update_package(pkg_id: str, body: PackageUpdate, user=Depends(require_role("admin", "superadmin"))):
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        if update:
            await db.packages.update_one({"id": pkg_id}, {"$set": update})
        return await db.packages.find_one({"id": pkg_id}, {"_id": 0})

    @router.delete("/packages/{pkg_id}")
    async def delete_package(pkg_id: str, user=Depends(require_role("superadmin"))):
        await db.packages.delete_one({"id": pkg_id})
        return {"message": "deleted"}

    return router
