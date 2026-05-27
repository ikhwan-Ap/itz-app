"""Calculator routes."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request

from models import CalculatorRunRequest
from calculator import (
    DRILLS_DB, ROLES_DB, ATTR_GROUPS, ALL_ATTRS,
    FIELD_ALL_ATTRS, GK_ATTR_GROUPS, GK_ALL_ATTRS,
    simulate_sniper,
)


def init_calculator_routes(db, current_user, rate_check, parse_dt, update_streak):
    """Register calculator endpoints."""
    router = APIRouter()

    @router.get("/calculator/meta")
    async def calc_meta():
        return {
            "drills": DRILLS_DB,
            "roles": ROLES_DB,
            "attrs": ATTR_GROUPS,
            "all_attrs": FIELD_ALL_ATTRS,
            "gk_attrs": GK_ATTR_GROUPS,
            "gk_all_attrs": GK_ALL_ATTRS,
        }

    @router.post("/calculator/run")
    async def calc_run(body: CalculatorRunRequest, request: Request, user=Depends(current_user)):
        rl_key = f"calc_run:{user['id']}"
        if not rate_check(rl_key, max_requests=20, window_seconds=60):
            raise HTTPException(429, "Terlalu banyak simulasi. Tunggu sebentar.")
        if user["role"] == "user":
            if user.get("status") != "active":
                raise HTTPException(403, "Account not active")
            if user.get("expires_at"):
                try:
                    exp = parse_dt(user["expires_at"])
                    if exp < datetime.now(timezone.utc):
                        raise HTTPException(403, "Package expired")
                except (ValueError, TypeError):
                    pass
            if user.get("max_clicks") is not None:
                used = user.get("clicks_used", 0)
                if used >= user["max_clicks"]:
                    raise HTTPException(403, "Trial click limit reached")

        white_set = set()
        for r in body.roles:
            for a in ROLES_DB.get(r, []):
                white_set.add(a)

        init_stats = {}
        for a in ALL_ATTRS:
            val = int(body.stats.get(a, 1))
            if a in white_set:
                val = max(1, val - int(body.bonus or 0))
            init_stats[a] = val

        drill_filter = [body.single_drill] if body.single_drill else None
        is_gk = "GK" in body.roles
        result = simulate_sniper(
            init_stats=init_stats,
            white_set=white_set,
            targets=body.targets,
            grey_limit=int(body.grey_limit or 40),
            drill_filter=drill_filter,
            white_multiplier=int(body.white_multiplier or 1),
            valid_attrs=set(GK_ALL_ATTRS) if is_gk else set(FIELD_ALL_ATTRS),
            soft_grey_cap=bool(drill_filter),
        )

        score_attrs = GK_ALL_ATTRS if is_gk else FIELD_ALL_ATTRS
        final_vals = {}
        for a in score_attrs:
            v = int(result["stats"].get(a, 1))
            if a in white_set:
                v += int(body.bonus or 0)
            final_vals[a] = v
        total = sum(final_vals.values())
        overall = round(total / 15)

        if user["role"] == "user":
            await update_streak(user["id"])
            await db.users.update_one({"id": user["id"]}, {"$inc": {"clicks_used": 1}})

        return {
            "history": result["history"],
            "final_stats": final_vals,
            "overall": overall,
            "total_cost": result["totalCost"],
            "white_set": list(white_set),
        }

    return router
