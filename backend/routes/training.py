"""Training results routes."""
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from models import TrainingResultSave, uid, now_iso
from core.pagination import paginate_meta


def init_training_routes(db, current_user):
    """Register training results endpoints."""
    router = APIRouter()

    @router.post("/training-results")
    async def save_training_result(body: TrainingResultSave, user=Depends(current_user)):
        if user.get("role") not in ("user", "admin", "superadmin"):
            raise HTTPException(403, "Not allowed")

        if user["role"] == "user":
            user_cap = user.get("max_history", 15)
            existing_count = await db.training_results.count_documents({"user_id": user["id"]})
            if existing_count >= int(user_cap):
                raise HTTPException(
                    400,
                    f"Batas {int(user_cap)} sesi tersimpan tercapai. Hapus sesi lama atau hubungi admin untuk menambah kapasitas.",
                )

        auto_title = body.title or f"{body.mode.upper()} — {', '.join(body.roles[:3]) or 'Custom'} — {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M')}"
        last_session = await db.training_results.find_one(
            {"user_id": user["id"]}, {"session_number": 1}, sort=[("session_number", -1)]
        )
        session_number = (last_session.get("session_number", 0) if last_session else 0) + 1
        doc = {
            "id": uid(),
            "user_id": user["id"],
            "user_email": user["email"],
            "session_number": session_number,
            "title": auto_title,
            "mode": body.mode,
            "position": body.position,
            "roles": body.roles,
            "input_stats": body.input_stats,
            "targets": body.targets,
            "grey_limit": int(body.grey_limit),
            "white_multiplier": int(body.white_multiplier),
            "final_stats": body.final_stats,
            "overall": int(body.overall),
            "total_cost": round(body.total_cost, 2),
            "history": body.history,
            "white_set": body.white_set,
            "note": body.note or "",
            "is_public": False,
            "share_slug": None,
            "shared_count": 0,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.training_results.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @router.get("/training-results")
    async def list_training_results(page: int = 1, limit: int = 20, mode: str = None, user=Depends(current_user)):
        limit = max(1, min(limit, 100))
        skip = (max(1, page) - 1) * limit
        q = {"user_id": user["id"]}
        if mode:
            q["mode"] = mode
        total = await db.training_results.count_documents(q)
        items = await db.training_results.find(
            q, {"_id": 0, "history": 0},
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        user_cap = user.get("max_history", 15)
        is_unlimited = user["role"] in ("admin", "superadmin")
        total_saved = await db.training_results.count_documents({"user_id": user["id"]})
        return {
            "items": items,
            "meta": paginate_meta(page, limit, total),
            "capacity": {
                "max": None if is_unlimited else int(user_cap),
                "used": total_saved,
                "unlimited": is_unlimited,
            },
        }

    @router.get("/training-results/{result_id}")
    async def get_training_result(result_id: str, user=Depends(current_user)):
        q = {"id": result_id}
        if user["role"] not in ("admin", "superadmin"):
            q["user_id"] = user["id"]
        doc = await db.training_results.find_one(q, {"_id": 0})
        if not doc:
            raise HTTPException(404, "Result tidak ditemukan")
        return doc

    @router.patch("/training-results/{result_id}/note")
    async def update_result_note(result_id: str, body: dict, user=Depends(current_user)):
        note = str(body.get("note", ""))[:500]
        res = await db.training_results.update_one(
            {"id": result_id, "user_id": user["id"]},
            {"$set": {"note": note, "updated_at": now_iso()}},
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Result tidak ditemukan")
        return {"ok": True}

    @router.delete("/training-results/{result_id}")
    async def delete_training_result(result_id: str, user=Depends(current_user)):
        q = {"id": result_id}
        if user["role"] not in ("admin", "superadmin"):
            q["user_id"] = user["id"]
        res = await db.training_results.delete_one(q)
        if res.deleted_count == 0:
            raise HTTPException(404, "Result tidak ditemukan")
        return {"ok": True}

    return router
