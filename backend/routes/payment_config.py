"""Payment config routes."""
from fastapi import APIRouter, Depends, Request

from models import PaymentConfigUpdate


def init_payment_config_routes(db, require_role, audit_log):
    """Register payment config endpoints."""
    router = APIRouter()

    @router.get("/payment-config")
    async def get_payment_config(user=Depends(require_role("admin", "superadmin"))):
        cfg = await db.payment_config.find_one({"id": "default"}, {"_id": 0})
        if not cfg:
            cfg = {
                "id": "default",
                "manual_enabled": True,
                "xendit_enabled": False,
                "xendit_api_key": "",
                "xendit_webhook_token": "",
                "midtrans_enabled": False,
                "midtrans_server_key": "",
                "midtrans_client_key": "",
                "bank_info": "",
            }
            await db.payment_config.insert_one(dict(cfg))
            cfg.pop("_id", None)
        return cfg

    @router.patch("/payment-config")
    async def update_payment_config(body: PaymentConfigUpdate, user=Depends(require_role("superadmin")), request: Request = None):
        update = {k: v for k, v in body.model_dump().items() if v is not None}
        await db.payment_config.update_one({"id": "default"}, {"$set": update}, upsert=True)
        await audit_log(
            actor=user,
            action="payment_config.update",
            target_type="payment_config",
            target_id="default",
            request=request,
            metadata={"fields": list(update.keys())},
        )
        return await db.payment_config.find_one({"id": "default"}, {"_id": 0})

    return router
