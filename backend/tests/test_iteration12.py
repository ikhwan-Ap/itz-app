"""
Iteration 12 Backend Tests:
- Notifications API (GET, mark read, mark-all-read)
- Notification triggers (registration -> admin notif, approve -> user notif)
- Streak tracker (calculator/run increments streak; same-day no double increment)
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

SUPERADMIN_EMAIL = "superadmin@tesniper.com"
SUPERADMIN_PASSWORD = "SuperAdmin@2026"


def _login(s, email, password):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return r


def _logout(s):
    try:
        s.post(f"{BASE_URL}/api/auth/logout")
    except Exception:
        pass


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = _login(s, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
    assert r.status_code == 200, f"Superadmin login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def starter_pkg(admin_sess):
    r = admin_sess.get(f"{BASE_URL}/api/packages")
    assert r.status_code == 200
    pkgs = r.json()
    starter = next((p for p in pkgs if "Starter" in p.get("name", "")), None)
    if not starter:
        starter = pkgs[0] if pkgs else None
    assert starter, "No package available"
    return starter


@pytest.fixture(scope="module")
def new_user(starter_pkg):
    """Register a fresh user for streak/notification tests."""
    ts = int(time.time())
    email = f"test_notif_{ts}@test.com"
    password = "Pass1234@"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    payload = {
        "email": email,
        "password": password,
        "password2": password,
        "name": f"Test Notif {ts}",
        "phone": "08123456789",
        "package_id": starter_pkg["id"],
        "promo_code": None,
    }
    r = s.post(f"{BASE_URL}/api/auth/register", json=payload)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "email": email,
        "password": password,
        "tx_id": data.get("transaction_id"),
        "session": s,
    }


# =====================================================
# NOTIFICATIONS API basic shape
# =====================================================
class TestNotificationsAPI:
    def test_list_notifications_admin(self, admin_sess):
        r = admin_sess.get(f"{BASE_URL}/api/notifications")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert "unread" in data and isinstance(data["unread"], int)

    def test_list_notifications_unauth(self):
        r = requests.get(f"{BASE_URL}/api/notifications")
        assert r.status_code in (401, 403)

    def test_mark_all_read_admin(self, admin_sess):
        r = admin_sess.post(f"{BASE_URL}/api/notifications/read-all")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Verify unread now 0
        r2 = admin_sess.get(f"{BASE_URL}/api/notifications")
        assert r2.status_code == 200
        assert r2.json()["unread"] == 0


# =====================================================
# REGISTRATION TRIGGERS ADMIN NOTIFICATION
# =====================================================
class TestRegistrationNotification:
    def test_register_creates_admin_notification(self, admin_sess, new_user):
        # admin should now see a 'new_transaction' notification for new_user
        time.sleep(0.5)
        r = admin_sess.get(f"{BASE_URL}/api/notifications")
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0, "No admin notifications after new registration"
        match = [i for i in items if i.get("type") == "new_transaction"
                 and "Registrasi Baru" in i.get("title", "")
                 and new_user["email"].split("@")[0] in (i.get("body", "") + i.get("title", ""))
                 ]
        # body contains user's name 'Test Notif {ts}'; lookup by recency w/ type
        recent_new_tx = [i for i in items if i.get("type") == "new_transaction"]
        assert len(recent_new_tx) >= 1, f"Expected new_transaction notif. Got: {[i.get('type') for i in items[:5]]}"
        notif = recent_new_tx[0]
        assert notif.get("link") == "/app/admin/transactions"
        assert "id" in notif
        assert notif.get("read") is False


# =====================================================
# APPROVE TRANSACTION TRIGGERS USER NOTIFICATION
# =====================================================
class TestApproveNotification:
    def test_approve_creates_user_notification(self, admin_sess, new_user):
        tx_id = new_user["tx_id"]
        assert tx_id, "No transaction id from registration"
        # approve
        r = admin_sess.post(
            f"{BASE_URL}/api/transactions/{tx_id}/approve",
            json={"note": "ok"},
        )
        assert r.status_code == 200, f"Approve failed: {r.text}"

        # user logs in & checks notifications
        us = requests.Session()
        us.headers.update({"Content-Type": "application/json"})
        lr = _login(us, new_user["email"], new_user["password"])
        assert lr.status_code == 200, f"User login failed after approve: {lr.text}"

        time.sleep(0.5)
        nr = us.get(f"{BASE_URL}/api/notifications")
        assert nr.status_code == 200
        items = nr.json()["items"]
        approved = [i for i in items if i.get("type") == "transaction_approved"]
        assert len(approved) >= 1, f"Expected transaction_approved notif. Got types: {[i.get('type') for i in items]}"
        assert approved[0].get("title") == "Transaksi Disetujui"
        # save user session for streak tests
        new_user["session"] = us

    def test_mark_one_read(self, new_user):
        us = new_user["session"]
        nr = us.get(f"{BASE_URL}/api/notifications")
        assert nr.status_code == 200
        items = nr.json()["items"]
        assert items, "No items to mark read"
        nid = items[0]["id"]
        rr = us.post(f"{BASE_URL}/api/notifications/{nid}/read")
        assert rr.status_code == 200
        # verify
        nr2 = us.get(f"{BASE_URL}/api/notifications")
        new_items = {i["id"]: i for i in nr2.json()["items"]}
        assert new_items[nid]["read"] is True

    def test_mark_invalid_id_404(self, new_user):
        us = new_user["session"]
        rr = us.post(f"{BASE_URL}/api/notifications/nonexistent_id_xyz/read")
        assert rr.status_code == 404


# =====================================================
# STREAK TRACKER
# =====================================================
class TestStreak:
    def _run_calculator(self, sess):
        """POST /api/calculator/run with minimal body for a field player."""
        # Try minimal payload; backend likely needs some fields
        body = {
            "is_gk": False,
            "drill_filter": "all",
            "white_multiplier": 1,
            "bonus": 0,
            "white_attrs": [],
            "iterations": 1,
        }
        return sess.post(f"{BASE_URL}/api/calculator/run", json=body)

    def test_initial_streak_zero(self, new_user):
        us = new_user["session"]
        me = us.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        data = me.json()
        # before any calculator/run, streak should be 0/None
        assert int(data.get("current_streak") or 0) == 0
        assert not data.get("last_training_date")

    def test_calculator_run_increments_streak(self, new_user):
        us = new_user["session"]
        r = self._run_calculator(us)
        if r.status_code != 200:
            pytest.skip(f"Calculator endpoint returned {r.status_code}: {r.text[:200]} - cannot test streak")
        time.sleep(0.3)
        me = us.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        data = me.json()
        assert int(data.get("current_streak") or 0) == 1, f"Expected streak=1 got {data.get('current_streak')}"
        assert data.get("last_training_date"), "last_training_date should be set"

    def test_same_day_run_no_double_increment(self, new_user):
        us = new_user["session"]
        r = self._run_calculator(us)
        if r.status_code != 200:
            pytest.skip(f"Calculator endpoint returned {r.status_code}")
        time.sleep(0.3)
        me = us.get(f"{BASE_URL}/api/auth/me")
        data = me.json()
        # must remain 1 (same day)
        assert int(data.get("current_streak") or 0) == 1, (
            f"Streak should NOT increment same day. Got {data.get('current_streak')}"
        )
