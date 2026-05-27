"""Transaction routes."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException

from models import TransactionApprove, TransactionReject, now_iso
from core.pagination import paginate_meta
from core.notify import create_notification


def init_transaction_routes(db, current_user, require_role, audit_log):
    """Register transaction endpoints."""
    router = APIRouter()

    @router.get("/transactions")
    async def list_transactions(page: int = 1, limit: int = 20, status: str = None, user=Depends(current_user)):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {}
        if user["role"] == "marketing":
            q["marketing_id"] = user["id"]
        elif user["role"] == "user":
            q["user_id"] = user["id"]
        elif user["role"] not in ("admin", "superadmin"):
            raise HTTPException(403, "Not allowed")
        if status:
            q["status"] = status
        total = await db.transactions.count_documents(q)
        items = await db.transactions.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    @router.post("/transactions/{tx_id}/approve")
    async def approve_tx(tx_id: str, body: TransactionApprove, user=Depends(require_role("admin", "superadmin"))):
        tx = await db.transactions.find_one({"id": tx_id})
        if not tx:
            raise HTTPException(404, "Not found")
        if tx["status"] != "pending":
            raise HTTPException(400, f"Already {tx['status']}")

        pkg = await db.packages.find_one({"id": tx["package_id"]}, {"_id": 0})
        if not pkg:
            raise HTTPException(400, "Package missing")

        now = datetime.now(timezone.utc)
        expires_at = None
        if not pkg.get("is_trial"):
            if pkg.get("duration_type") == "yearly":
                expires_at = (now + timedelta(days=365 * pkg.get("duration_value", 1))).isoformat()
            else:
                expires_at = (now + timedelta(days=30 * pkg.get("duration_value", 1))).isoformat()
        elif pkg.get("duration_value"):
            expires_at = (now + timedelta(days=pkg["duration_value"])).isoformat()

        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$set": {
                "status": "active",
                "package_id": tx["package_id"],
                "expires_at": expires_at,
                "max_clicks": pkg.get("max_clicks"),
                "max_history": 15,
                "clicks_used": 0,
            }},
        )
        await db.transactions.update_one(
            {"id": tx_id},
            {"$set": {
                "status": "approved",
                "approved_by": user["id"],
                "approved_at": now_iso(),
                "note": body.note or "",
            }},
        )
        if tx.get("promo_code"):
            await db.promos.update_one({"code": tx["promo_code"]}, {"$inc": {"uses": 1}})

        await create_notification(
            db,
            tx["user_id"],
            "transaction_approved",
            "Transaksi Disetujui",
            f"Paket {pkg.get('name', '')} sudah aktif. Selamat berlatih!",
            "/app",
        )
        await audit_log(
            actor=user,
            action="transaction.approve",
            target_type="transaction",
            target_id=tx_id,
            request=None,
            metadata={"package": pkg.get("name"), "user_id": tx["user_id"], "note": body.note or ""},
        )
        return {"message": "approved"}

    @router.post("/transactions/{tx_id}/reject")
    async def reject_tx(tx_id: str, body: TransactionReject, user=Depends(require_role("admin", "superadmin"))):
        tx = await db.transactions.find_one({"id": tx_id})
        if not tx:
            raise HTTPException(404, "Not found")
        if tx["status"] != "pending":
            raise HTTPException(400, f"Already {tx['status']}")
        await db.transactions.update_one(
            {"id": tx_id},
            {"$set": {"status": "rejected", "approved_by": user["id"], "approved_at": now_iso(), "note": body.note or ""}},
        )
        await db.users.update_one({"id": tx["user_id"]}, {"$set": {"status": "rejected"}})
        await create_notification(
            db,
            tx["user_id"],
            "transaction_rejected",
            "Transaksi Ditolak",
            body.note or "Silakan hubungi admin untuk informasi lebih lanjut.",
            "/app",
        )
        await audit_log(
            actor=user,
            action="transaction.reject",
            target_type="transaction",
            target_id=tx_id,
            request=None,
            metadata={"user_id": tx["user_id"], "note": body.note or ""},
        )
        return {"message": "rejected"}

    return router
