"""Promo code routes."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request

from models import PromoCreate, PromoUpdate, uid, now_iso
from core.pagination import paginate_meta


def init_promo_routes(db, current_user, require_role, rate_check, parse_dt):
    """Register promo endpoints."""
    router = APIRouter()

    @router.get("/promos")
    async def list_promos(page: int = 1, limit: int = 20, user=Depends(current_user)):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {}
        if user["role"] == "marketing":
            q = {"owner_marketing_id": user["id"]}
        elif user["role"] not in ("admin", "superadmin"):
            raise HTTPException(403, "Not allowed")
        total = await db.promos.count_documents(q)
        items = await db.promos.find(q, {"_id": 0}).sort("code", 1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    @router.post("/promos")
    async def create_promo(body: PromoCreate, user=Depends(current_user)):
        if user["role"] not in ("admin", "superadmin", "marketing"):
            raise HTTPException(403, "Not allowed")
        code = body.code.upper().strip()
        if await db.promos.find_one({"code": code}):
            raise HTTPException(400, "Code already exists")

        pkg = await db.packages.find_one({"id": body.package_id, "active": True}, {"_id": 0})
        if not pkg:
            raise HTTPException(400, "Paket tidak valid atau tidak aktif")

        owner_id = body.owner_marketing_id
        if user["role"] == "marketing":
            owner_id = user["id"]

        doc = {
            "id": uid(),
            "code": code,
            "discount_type": body.discount_type,
            "discount_value": body.discount_value,
            "max_uses": body.max_uses,
            "valid_until": body.valid_until,
            "package_id": body.package_id,
            "owner_marketing_id": owner_id,
            "active": body.active,
            "uses": 0,
            "created_at": now_iso(),
        }
        await db.promos.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.patch("/promos/{promo_id}")
    async def update_promo(promo_id: str, body: PromoUpdate, user=Depends(current_user)):
        if user["role"] not in ("admin", "superadmin", "marketing"):
            raise HTTPException(403, "Not allowed")
        p = await db.promos.find_one({"id": promo_id})
        if not p:
            raise HTTPException(404, "Not found")
        if user["role"] == "marketing" and p.get("owner_marketing_id") != user["id"]:
            raise HTTPException(403, "Not your promo code")
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        if user["role"] == "marketing":
            update.pop("owner_marketing_id", None)
        if update:
            await db.promos.update_one({"id": promo_id}, {"$set": update})
        return await db.promos.find_one({"id": promo_id}, {"_id": 0})

    @router.delete("/promos/{promo_id}")
    async def delete_promo(promo_id: str, user=Depends(require_role("admin", "superadmin"))):
        await db.promos.delete_one({"id": promo_id})
        return {"message": "deleted"}

    @router.get("/promos/validate/{code}")
    async def validate_promo(code: str, package_id: str, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not rate_check(f"promo_validate:{ip}", max_requests=10, window_seconds=60):
            raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi dalam 1 menit.")

        promo = await db.promos.find_one({"code": code.upper(), "active": True}, {"_id": 0})
        if not promo:
            raise HTTPException(404, "Invalid code")
        pkg = await db.packages.find_one({"id": package_id, "active": True}, {"_id": 0})
        if not pkg:
            raise HTTPException(404, "Invalid package")
        if not promo.get("package_id"):
            raise HTTPException(400, "Promo code belum di-assign ke paket. Hubungi admin.")
        if promo["package_id"] != package_id:
            raise HTTPException(400, "Promo code tidak berlaku untuk paket ini")
        now = datetime.now(timezone.utc)
        if promo.get("valid_until"):
            if parse_dt(promo["valid_until"]) < now:
                raise HTTPException(400, "Promo code expired")
        if promo.get("max_uses") is not None and promo.get("uses", 0) >= promo["max_uses"]:
            raise HTTPException(400, "Limit reached")
        if promo["discount_type"] == "percent":
            discount = pkg["price"] * (promo["discount_value"] / 100.0)
        else:
            discount = promo["discount_value"]
        discount = min(discount, pkg["price"])
        return {"discount": discount, "final_amount": max(0, pkg["price"] - discount), "promo_code": promo["code"]}

    return router
