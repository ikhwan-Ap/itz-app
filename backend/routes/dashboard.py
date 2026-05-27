"""Dashboard stats routes (admin + marketing)."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends

from core.pagination import paginate_meta


def init_dashboard_routes(db, require_role, current_user, parse_dt, sanitize_user):
    """Register dashboard endpoints."""
    router = APIRouter()

    @router.get("/dashboard/admin")
    async def admin_stats(user=Depends(require_role("admin", "superadmin"))):
        now = datetime.now(timezone.utc)
        all_users = await db.users.find({}, {"_id": 0, "password_hash": 0, "password2_hash": 0}).to_list(10000)
        active_users = [u for u in all_users if u.get("status") == "active"]
        pending_users = [u for u in all_users if u.get("status") == "pending"]
        expiring_soon = []
        for u in active_users:
            if u.get("expires_at"):
                try:
                    exp = parse_dt(u["expires_at"])
                    if exp > now and (exp - now) < timedelta(days=7):
                        expiring_soon.append(u)
                except (ValueError, TypeError):
                    pass

        txs = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
        approved = [t for t in txs if t["status"] == "approved"]
        pending_tx = [t for t in txs if t["status"] == "pending"]

        gross = sum(t["amount"] for t in approved)
        net = sum(t["final_amount"] for t in approved)
        marketing = sum(t.get("marketing_cut", 0) for t in approved)
        discount_total = sum(t.get("discount_amount", 0) for t in approved)

        months = {}
        for t in approved:
            dt = parse_dt(t["created_at"])
            key = dt.strftime("%Y-%m")
            if key not in months:
                months[key] = {"gross": 0, "net": 0, "marketing": 0, "count": 0}
            months[key]["gross"] += t["amount"]
            months[key]["net"] += t["final_amount"]
            months[key]["marketing"] += t.get("marketing_cut", 0)
            months[key]["count"] += 1

        chart = []
        for i in range(5, -1, -1):
            dt = now - timedelta(days=30 * i)
            key = dt.strftime("%Y-%m")
            m = months.get(key, {"gross": 0, "net": 0, "marketing": 0, "count": 0})
            chart.append({"month": dt.strftime("%b %Y"), **m})

        return {
            "total_users": len(all_users),
            "active_users": len(active_users),
            "pending_users": len(pending_users),
            "expiring_soon": len(expiring_soon),
            "expiring_list": [sanitize_user(u) for u in expiring_soon][:20],
            "pending_tx_count": len(pending_tx),
            "gross": gross,
            "net": net,
            "marketing_total": marketing,
            "discount_total": discount_total,
            "chart": chart,
            "recent_tx": txs[:10],
        }

    @router.get("/dashboard/marketing")
    async def marketing_stats(user=Depends(require_role("marketing", "admin", "superadmin"))):
        now = datetime.now(timezone.utc)
        filter_id = user["id"] if user["role"] == "marketing" else None

        q_tx = {"marketing_id": filter_id, "status": "approved"} if filter_id else {"status": "approved", "marketing_id": {"$ne": None}}
        txs = await db.transactions.find(q_tx, {"_id": 0}).sort("created_at", -1).to_list(5000)

        q_promo = {"owner_marketing_id": filter_id} if filter_id else {"owner_marketing_id": {"$ne": None}}
        promos = await db.promos.find(q_promo, {"_id": 0}).to_list(500)

        total_earnings = sum(t.get("marketing_cut", 0) for t in txs)
        total_conversions = len(txs)

        chart = {}
        for t in txs:
            dt = parse_dt(t["created_at"])
            key = dt.strftime("%Y-%m")
            if key not in chart:
                chart[key] = {"earnings": 0, "count": 0}
            chart[key]["earnings"] += t.get("marketing_cut", 0)
            chart[key]["count"] += 1

        chart_arr = []
        for i in range(5, -1, -1):
            dt = now - timedelta(days=30 * i)
            key = dt.strftime("%Y-%m")
            m = chart.get(key, {"earnings": 0, "count": 0})
            chart_arr.append({"month": dt.strftime("%b %Y"), **m})

        return {
            "total_earnings": total_earnings,
            "total_conversions": total_conversions,
            "active_promos": len([p for p in promos if p.get("active")]),
            "promos": promos,
            "chart": chart_arr,
            "recent_tx": txs[:20],
        }

    return router
