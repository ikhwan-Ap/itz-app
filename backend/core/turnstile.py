"""Cloudflare Turnstile verification helper."""
import os
import logging
import requests

logger = logging.getLogger("tesniper")

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str, ip: str = None) -> bool:
    """Verify a Turnstile token. Returns True if valid, False otherwise.
    Returns True if no secret is configured (graceful degradation in dev)."""
    secret = os.environ.get("TURNSTILE_SECRET_KEY")
    if not secret:
        # Not configured — skip verification (dev mode)
        return True
    if not token:
        return False
    try:
        payload = {"secret": secret, "response": token}
        if ip:
            payload["remoteip"] = ip
        r = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=5)
        data = r.json()
        if not data.get("success"):
            logger.warning(f"Turnstile failed: {data.get('error-codes')}")
            return False
        return True
    except Exception as e:
        logger.error(f"Turnstile verify error: {e}")
        return False
