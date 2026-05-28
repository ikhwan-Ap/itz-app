"""KlikQRIS API client + signature validator."""
import os
import logging
import requests

logger = logging.getLogger("tesniper")

KLIKQRIS_BASE_URL = os.environ.get("KLIKQRIS_BASE_URL", "https://klikqris.com/api")
KLIKQRIS_CREATE_PATH = os.environ.get("KLIKQRIS_CREATE_PATH", "/qrisv2/create")
KLIKQRIS_STATUS_PATH = os.environ.get("KLIKQRIS_STATUS_PATH", "/qris/status")


def _headers():
    api_key = os.environ.get("KLIKQRIS_API_KEY", "")
    merchant_id = os.environ.get("KLIKQRIS_MERCHANT_ID", "")
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (KlikQRIS Adapter; Independent Service)",
        "x-api-key": api_key,
        "id_merchant": merchant_id,
    }


def create_qris_invoice(order_id: str, amount: int, keterangan: str = "") -> dict:
    """Create a new QRIS transaction. Returns the response data dict."""
    merchant_id = os.environ.get("KLIKQRIS_MERCHANT_ID", "")
    if not merchant_id or not os.environ.get("KLIKQRIS_API_KEY"):
        raise RuntimeError("KlikQRIS not configured (set KLIKQRIS_API_KEY + KLIKQRIS_MERCHANT_ID)")

    payload = {
        "order_id": order_id,
        "id_merchant": merchant_id,  # send as string per adapter convention
        "amount": int(amount),
        "keterangan": keterangan or "",
    }
    try:
        r = requests.post(f"{KLIKQRIS_BASE_URL}{KLIKQRIS_CREATE_PATH}", json=payload, headers=_headers(), timeout=15)
        r.raise_for_status()
        body = r.json()
        if not body.get("status"):
            raise RuntimeError(f"KlikQRIS create failed: {body.get('message')}")
        return body["data"]
    except requests.RequestException as e:
        logger.error(f"KlikQRIS create error: {e}")
        raise RuntimeError(f"Gagal membuat invoice QRIS: {e}")


def check_qris_status(order_id: str) -> dict:
    """Manually check status of a QRIS transaction."""
    try:
        r = requests.get(f"{KLIKQRIS_BASE_URL}{KLIKQRIS_STATUS_PATH}/{order_id}", headers=_headers(), timeout=10)
        r.raise_for_status()
        body = r.json()
        if not body.get("status"):
            raise RuntimeError(f"KlikQRIS status failed: {body.get('message')}")
        return body["data"]
    except requests.RequestException as e:
        logger.error(f"KlikQRIS status error: {e}")
        raise RuntimeError(f"Gagal cek status: {e}")


def verify_webhook_signature(received_signature: str, stored_signature: str) -> bool:
    """Compare webhook signature with the one stored when invoice was created.
    Constant-time comparison to prevent timing attacks."""
    if not received_signature or not stored_signature:
        return False
    if len(received_signature) != len(stored_signature):
        return False
    result = 0
    for a, b in zip(received_signature, stored_signature):
        result |= ord(a) ^ ord(b)
    return result == 0
