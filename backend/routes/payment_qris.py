"""QRIS Payment routes (KlikQRIS integration).
Phase 1: Admin test mode only. Not exposed to users yet."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request

from models import uid, now_iso
from core.klikqris import create_qris_invoice, check_qris_status, verify_webhook_signature
from core.notify import create_notification
from core.pagination import paginate_meta

logger = logging.getLogger("tesniper")


def init_qris_routes(db, current_user, require_role):
    """Register QRIS payment endpoints."""
    router = APIRouter()

    # ===== ADMIN TEST: Create test invoice (superadmin only) =====
    @router.post("/payment/qris/test-create")
    async def test_create_payment(request: Request, user=Depends(require_role("superadmin"))):
        """Superadmin: create a test QRIS invoice to verify integration."""
        body = await request.json()
        amount = int(body.get("amount", 1000))
        keterangan = body.get("keterangan", "Test pembayaran QRIS")

        order_id = f"TEST-{uid()[:8].upper()}-{int(datetime.now(timezone.utc).timestamp())}"

        try:
            qris_data = create_qris_invoice(order_id, amount, keterangan)
        except RuntimeError as e:
            raise HTTPException(502, str(e))

        payment_doc = {
            "id": uid(),
            "user_id": user["id"],
            "transaction_id": None,
            "package_id": None,
            "provider": "klikqris",
            "order_id": order_id,
            "amount": amount,
            "total_amount": float(qris_data.get("total_amount", amount)),
            "qr_code_url": qris_data.get("qris_url"),
            "qr_image": qris_data.get("qris_image"),
            "signature": qris_data.get("signature", ""),
            "status": "pending",
            "is_test": True,
            "expires_at": qris_data.get("expired_at"),
            "paid_at": None,
            "callback_payload": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.payments.insert_one(payment_doc)

        return {
            "payment_id": payment_doc["id"],
            "order_id": order_id,
            "qr_code_url": payment_doc["qr_code_url"],
            "qr_image": payment_doc["qr_image"],
            "total_amount": payment_doc["total_amount"],
            "expires_at": payment_doc["expires_at"],
            "signature": payment_doc["signature"][:20] + "...",
            "status": "pending",
        }

    # ===== ADMIN: Check status manually =====
    @router.get("/payment/qris/check/{order_id}")
    async def admin_check_status(order_id: str, user=Depends(require_role("superadmin"))):
        """Superadmin: manually check KlikQRIS status + auto-sync if paid."""
        payment = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
        if not payment:
            raise HTTPException(404, "Payment tidak ditemukan di DB")

        remote = None
        synced = False
        try:
            remote = check_qris_status(order_id)
            remote_status = remote.get("status", "").upper()
            # Auto-sync if remote is paid but local still pending
            if payment["status"] == "pending" and remote_status in ("SUCCESS", "PAID"):
                await _process_paid(db, payment, remote)
                payment["status"] = "paid"
                synced = True
            elif payment["status"] == "pending" and remote_status == "EXPIRED":
                await db.payments.update_one({"id": payment["id"]}, {"$set": {"status": "expired", "updated_at": now_iso()}})
                payment["status"] = "expired"
                synced = True
        except Exception as e:
            remote = {"error": str(e)}

        return {
            "local": {
                "order_id": payment["order_id"],
                "status": payment["status"],
                "amount": payment["amount"],
                "total_amount": payment.get("total_amount"),
                "paid_at": payment.get("paid_at"),
                "callback_received": payment.get("callback_payload") is not None,
                "synced": synced,
            },
            "remote": remote,
        }

    # ===== PRODUCTION: Create payment for real transaction =====
    @router.post("/payment/qris/create")
    async def create_payment(request: Request, user=Depends(current_user)):
        """User creates a QRIS payment for their pending transaction."""
        body = await request.json()
        transaction_id = body.get("transaction_id")
        if not transaction_id:
            raise HTTPException(400, "transaction_id required")

        tx = await db.transactions.find_one({"id": transaction_id, "user_id": user["id"], "status": "pending"})
        if not tx:
            raise HTTPException(404, "Transaksi pending tidak ditemukan")

        existing = await db.payments.find_one({"transaction_id": transaction_id, "status": "pending"})
        if existing:
            return {
                "payment_id": existing["id"],
                "order_id": existing["order_id"],
                "qr_code_url": existing.get("qr_code_url"),
                "qr_image": existing.get("qr_image"),
                "total_amount": existing.get("total_amount"),
                "expires_at": existing.get("expires_at"),
                "status": existing["status"],
            }

        order_id = f"ITZ-{uid()[:8].upper()}-{int(datetime.now(timezone.utc).timestamp())}"
        amount = int(tx["final_amount"])

        pkg = await db.packages.find_one({"id": tx["package_id"]}, {"name": 1, "_id": 0})
        keterangan = f"Pembayaran {pkg.get('name', 'Paket')} - {user.get('name', user['email'])}"

        try:
            qris_data = create_qris_invoice(order_id, amount, keterangan)
        except RuntimeError as e:
            raise HTTPException(502, str(e))

        payment_doc = {
            "id": uid(),
            "user_id": user["id"],
            "transaction_id": transaction_id,
            "package_id": tx["package_id"],
            "provider": "klikqris",
            "order_id": order_id,
            "amount": amount,
            "total_amount": float(qris_data.get("total_amount", amount)),
            "qr_code_url": qris_data.get("qris_url"),
            "qr_image": qris_data.get("qr_image"),
            "signature": qris_data.get("signature", ""),
            "status": "pending",
            "is_test": False,
            "expires_at": qris_data.get("expired_at"),
            "paid_at": None,
            "callback_payload": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.payments.insert_one(payment_doc)

        return {
            "payment_id": payment_doc["id"],
            "order_id": order_id,
            "qr_code_url": payment_doc["qr_code_url"],
            "qr_image": payment_doc["qr_image"],
            "total_amount": payment_doc["total_amount"],
            "expires_at": payment_doc["expires_at"],
            "status": "pending",
        }

    # ===== User polling =====
    @router.get("/payment/qris/status/{order_id}")
    async def payment_status(order_id: str, user=Depends(current_user)):
        """User polls payment status."""
        payment = await db.payments.find_one({"order_id": order_id, "user_id": user["id"]}, {"_id": 0})
        if not payment:
            raise HTTPException(404, "Payment tidak ditemukan")

        if payment["status"] == "pending":
            try:
                remote = check_qris_status(order_id)
                remote_status = remote.get("status", "").upper()
                if remote_status in ("SUCCESS", "PAID"):
                    await _process_paid(db, payment, remote)
                    payment["status"] = "paid"
                elif remote_status == "EXPIRED":
                    await db.payments.update_one({"id": payment["id"]}, {"$set": {"status": "expired", "updated_at": now_iso()}})
                    payment["status"] = "expired"
            except Exception:
                pass

        return {
            "order_id": payment["order_id"],
            "status": payment["status"],
            "total_amount": payment.get("total_amount"),
            "paid_at": payment.get("paid_at"),
        }

    # ===== Webhook (public, signature-verified) =====
    @router.post("/payment/qris/callback")
    async def qris_callback(request: Request):
        """KlikQRIS webhook — no auth, validated by signature."""
        try:
            payload = await request.json()
        except Exception:
            raise HTTPException(400, "Invalid JSON")

        order_id = payload.get("order_id")
        status = (payload.get("status") or "").upper()
        received_sig = payload.get("signature", "")

        if not order_id:
            raise HTTPException(400, "Missing order_id")

        payment = await db.payments.find_one({"order_id": order_id})
        if not payment:
            logger.warning(f"Webhook for unknown order_id: {order_id}")
            return {"status": "ok"}

        if not verify_webhook_signature(received_sig, payment.get("signature", "")):
            logger.warning(f"Webhook signature mismatch for {order_id}")
            raise HTTPException(403, "Invalid signature")

        if payment["status"] != "pending":
            return {"status": "ok", "message": "already processed"}

        await db.payments.update_one(
            {"id": payment["id"]},
            {"$set": {"callback_payload": payload, "updated_at": now_iso()}},
        )

        if status in ("PAID", "SUCCESS"):
            await _process_paid(db, payment, payload)
        elif status == "EXPIRED":
            await db.payments.update_one(
                {"id": payment["id"]},
                {"$set": {"status": "expired", "updated_at": now_iso()}},
            )

        return {"status": "ok"}

    # ===== Admin: list all payments =====
    @router.get("/admin/payments")
    async def list_payments(page: int = 1, limit: int = 20, user=Depends(require_role("admin", "superadmin"))):
        limit = min(limit, 100)
        skip = (page - 1) * limit
        total = await db.payments.count_documents({})
        items = await db.payments.find({}, {"_id": 0, "callback_payload": 0, "qr_image": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"items": items, "meta": paginate_meta(page, limit, total)}

    return router


async def _process_paid(db, payment, payload):
    """Process a successful payment: update payment, auto-approve transaction, activate user."""
    from datetime import timedelta

    payment_date = payload.get("payment_date") or payload.get("paid_at") or now_iso()

    await db.payments.update_one(
        {"id": payment["id"]},
        {"$set": {"status": "paid", "paid_at": payment_date, "updated_at": now_iso()}},
    )

    # If test payment, skip transaction processing
    if payment.get("is_test") or not payment.get("transaction_id"):
        logger.info(f"Test QRIS payment paid: order={payment['order_id']}")
        return

    tx = await db.transactions.find_one({"id": payment["transaction_id"]})
    if not tx or tx["status"] != "pending":
        return

    pkg = await db.packages.find_one({"id": tx["package_id"]}, {"_id": 0})
    if not pkg:
        return

    now = datetime.now(timezone.utc)
    tx_type = tx.get("tx_type", "register")

    if not pkg.get("is_trial"):
        duration_days = 365 * pkg.get("duration_value", 1) if pkg.get("duration_type") == "yearly" else 30 * pkg.get("duration_value", 1)
    elif pkg.get("duration_value"):
        duration_days = pkg["duration_value"]
    else:
        duration_days = 0

    if tx_type == "renewal" and duration_days > 0:
        current_user = await db.users.find_one({"id": tx["user_id"]}, {"expires_at": 1, "_id": 0})
        base = now
        if current_user and current_user.get("expires_at"):
            try:
                cur_exp = datetime.fromisoformat(current_user["expires_at"].replace("Z", "+00:00"))
                if cur_exp > now:
                    base = cur_exp
            except (ValueError, TypeError):
                pass
        expires_at = (base + timedelta(days=duration_days)).isoformat()
    elif duration_days > 0:
        expires_at = (now + timedelta(days=duration_days)).isoformat()
    else:
        expires_at = None

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
        {"id": tx["id"]},
        {"$set": {
            "status": "approved",
            "approved_by": "system_qris",
            "approved_at": now_iso(),
            "note": f"Auto-approved via QRIS payment ({payment['order_id']})",
        }},
    )

    if tx.get("promo_code"):
        await db.promos.update_one({"code": tx["promo_code"]}, {"$inc": {"uses": 1}})

    await create_notification(
        db,
        tx["user_id"],
        "payment_success",
        "Pembayaran Berhasil",
        f"Paket {pkg.get('name', '')} sudah aktif. Selamat berlatih!",
        "/app",
    )
    logger.info(f"QRIS payment processed: order={payment['order_id']} user={tx['user_id']} pkg={pkg.get('name')}")
