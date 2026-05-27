"""Health check routes."""
import os
import logging
from fastapi import APIRouter, HTTPException

from models import now_iso

logger = logging.getLogger("tesniper")
router = APIRouter()


def init_health_routes(client, db):
    """Register health endpoints with the given mongo client/db."""

    @router.get("/health")
    async def health_check():
        """Public health check — returns app status and version info."""
        return {
            "status": "ok",
            "app": "itz-app",
            "env": os.environ.get("APP_ENV", "development"),
            "timestamp": now_iso(),
        }

    @router.get("/health/db")
    async def health_db():
        """Public DB health check — verifies MongoDB connectivity."""
        try:
            await client.admin.command("ping")
            count = await db.users.estimated_document_count()
            return {
                "status": "ok",
                "db": os.environ.get("DB_NAME", "itz_app"),
                "users_count": count,
                "timestamp": now_iso(),
            }
        except Exception as e:
            logger.error(f"DB health check failed: {e}")
            raise HTTPException(503, detail={"status": "error", "message": "Database unavailable"})

    return router
