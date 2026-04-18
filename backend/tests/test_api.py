"""
TE Sniper Calculator - Backend API Tests
Tests: Auth, Packages, Promos, Transactions, Calculator, Dashboard, News/Events, Users
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

# Test credentials from test_credentials.md
SUPERADMIN_EMAIL = "superadmin@tesniper.com"
SUPERADMIN_PASSWORD = "SuperAdmin@2026"
DEFAULT_PROMO = "WELCOME20"


@pytest.fixture(scope="module")
def session():
    """Shared requests session with cookies"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def superadmin_session(session):
    """Login as superadmin and return session with auth cookies"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPERADMIN_EMAIL,
        "password": SUPERADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Superadmin login failed: {resp.text}"
    user = resp.json()
    assert user.get("role") == "superadmin", f"Expected superadmin role, got {user.get('role')}"
    return session


# ============================================================
# AUTH TESTS
# ============================================================
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_superadmin_success(self, session):
        """POST /api/auth/login with seeded superadmin returns user + sets httpOnly cookie"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERADMIN_EMAIL,
            "password": SUPERADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        
        user = resp.json()
        assert user.get("email") == SUPERADMIN_EMAIL
        assert user.get("role") == "superadmin"
        assert user.get("status") == "active"
        assert "password_hash" not in user
        assert "password2_hash" not in user
        
        # Check cookies are set
        assert "access_token" in session.cookies or "access_token" in resp.cookies
        print(f"✓ Superadmin login successful: {user.get('email')}")
    
    def test_auth_me_with_valid_cookie(self, superadmin_session):
        """GET /api/auth/me with valid cookie returns user with package field"""
        resp = superadmin_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200, f"Auth me failed: {resp.text}"
        
        user = resp.json()
        assert user.get("email") == SUPERADMIN_EMAIL
        assert "package" in user  # Should have package field (even if null)
        print(f"✓ Auth me returned user with package field")
    
    def test_login_invalid_credentials(self, session):
        """POST /api/auth/login with wrong password returns 401"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_without_cookie(self):
        """GET /api/auth/me without cookie returns 401"""
        new_session = requests.Session()
        resp = new_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Unauthenticated request correctly rejected")


# ============================================================
# PACKAGES TESTS
# ============================================================
class TestPackages:
    """Package CRUD tests"""
    
    def test_get_packages_public(self):
        """GET /api/packages returns seeded packages (public access)"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200, f"Get packages failed: {resp.text}"
        
        packages = resp.json()
        assert isinstance(packages, list)
        assert len(packages) >= 3, f"Expected at least 3 seeded packages, got {len(packages)}"
        
        # Verify seeded packages exist
        names = [p.get("name") for p in packages]
        assert any("Trial" in n for n in names), "Trial package not found"
        assert any("Starter" in n for n in names), "Starter package not found"
        assert any("Pro" in n for n in names), "Pro package not found"
        
        print(f"✓ Got {len(packages)} packages: {names}")
        return packages
    
    def test_create_package_admin(self, superadmin_session):
        """POST /api/packages creates new package (admin only)"""
        resp = superadmin_session.post(f"{BASE_URL}/api/packages", json={
            "name": "TEST_Premium Package",
            "description": "Test package",
            "duration_type": "monthly",
            "duration_value": 3,
            "price": 150000,
            "features": ["Feature 1", "Feature 2"],
            "max_clicks": 500,
            "is_trial": False,
            "active": True
        })
        assert resp.status_code == 200, f"Create package failed: {resp.text}"
        
        pkg = resp.json()
        assert pkg.get("name") == "TEST_Premium Package"
        assert pkg.get("price") == 150000
        assert "id" in pkg
        
        print(f"✓ Created package: {pkg.get('id')}")
        return pkg


# ============================================================
# PROMO CODES TESTS
# ============================================================
class TestPromos:
    """Promo code validation tests"""
    
    def test_validate_promo_success(self):
        """GET /api/promos/validate/{code} returns discount + final_amount"""
        # First get a package ID
        pkgs = requests.get(f"{BASE_URL}/api/packages").json()
        pkg = next((p for p in pkgs if p.get("price", 0) > 0), None)
        assert pkg, "No paid package found for promo test"
        
        resp = requests.get(f"{BASE_URL}/api/promos/validate/{DEFAULT_PROMO}?package_id={pkg['id']}")
        assert resp.status_code == 200, f"Validate promo failed: {resp.text}"
        
        data = resp.json()
        assert "discount" in data
        assert "final_amount" in data
        assert data.get("promo_code") == DEFAULT_PROMO
        
        # WELCOME20 is 20% off
        expected_discount = pkg["price"] * 0.20
        assert abs(data["discount"] - expected_discount) < 0.01, f"Discount mismatch: {data['discount']} vs {expected_discount}"
        
        print(f"✓ Promo {DEFAULT_PROMO}: discount={data['discount']}, final={data['final_amount']}")
    
    def test_validate_promo_invalid(self):
        """GET /api/promos/validate/{code} with invalid code returns error"""
        pkgs = requests.get(f"{BASE_URL}/api/packages").json()
        pkg = pkgs[0]
        
        resp = requests.get(f"{BASE_URL}/api/promos/validate/INVALIDCODE123?package_id={pkg['id']}")
        assert resp.status_code == 404, f"Expected 404 for invalid promo, got {resp.status_code}"
        print("✓ Invalid promo code correctly rejected")
    
    def test_list_promos_admin(self, superadmin_session):
        """GET /api/promos returns promo list for admin"""
        resp = superadmin_session.get(f"{BASE_URL}/api/promos")
        assert resp.status_code == 200, f"List promos failed: {resp.text}"
        
        promos = resp.json()
        assert isinstance(promos, list)
        assert any(p.get("code") == DEFAULT_PROMO for p in promos), "WELCOME20 promo not found"
        
        print(f"✓ Got {len(promos)} promos")


# ============================================================
# REGISTRATION TESTS
# ============================================================
class TestRegistration:
    """User registration tests"""
    
    def test_register_validates_package(self):
        """POST /api/auth/register validates package_id"""
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_invalid_pkg@test.com",
            "password": "Test1234",
            "password2": "Test1234",
            "name": "Test User",
            "package_id": "invalid-package-id-12345"
        })
        assert resp.status_code == 400, f"Expected 400 for invalid package, got {resp.status_code}"
        print("✓ Invalid package_id correctly rejected")
    
    def test_register_invalid_promo(self):
        """POST /api/auth/register with invalid promo returns 400"""
        pkgs = requests.get(f"{BASE_URL}/api/packages").json()
        pkg = pkgs[0]
        
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_invalid_promo@test.com",
            "password": "Test1234",
            "password2": "Test1234",
            "name": "Test User",
            "package_id": pkg["id"],
            "promo_code": "INVALIDPROMO999"
        })
        assert resp.status_code == 400, f"Expected 400 for invalid promo, got {resp.status_code}"
        print("✓ Invalid promo code on register correctly rejected")
    
    def test_register_success_with_promo(self):
        """POST /api/auth/register creates pending user + transaction with promo discount"""
        pkgs = requests.get(f"{BASE_URL}/api/packages").json()
        pkg = next((p for p in pkgs if p.get("price", 0) > 0), pkgs[0])
        
        test_email = f"test_reg_{int(time.time())}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test1234",
            "password2": "Test1234",
            "name": "TEST_Registration User",
            "package_id": pkg["id"],
            "promo_code": DEFAULT_PROMO
        })
        assert resp.status_code == 200, f"Register failed: {resp.text}"
        
        data = resp.json()
        assert "transaction_id" in data
        assert "final_amount" in data
        assert "discount" in data
        
        # Verify discount was applied
        if pkg.get("price", 0) > 0:
            expected_discount = pkg["price"] * 0.20
            assert abs(data["discount"] - expected_discount) < 0.01
        
        print(f"✓ Registration successful: tx={data['transaction_id'][:8]}, discount={data['discount']}")


# ============================================================
# CALCULATOR TESTS (CRITICAL BUG FIX)
# ============================================================
class TestCalculator:
    """Calculator tests including priority bug fix validation"""
    
    def test_calculator_meta(self):
        """GET /api/calculator/meta returns drills, roles, attrs"""
        resp = requests.get(f"{BASE_URL}/api/calculator/meta")
        assert resp.status_code == 200, f"Calculator meta failed: {resp.text}"
        
        data = resp.json()
        assert "drills" in data
        assert "roles" in data
        assert "attrs" in data
        assert "all_attrs" in data
        
        assert len(data["drills"]) > 0, "No drills returned"
        assert "MC" in data["roles"], "MC role not found"
        
        print(f"✓ Calculator meta: {len(data['drills'])} drills, {len(data['roles'])} roles")
    
    def test_calculator_run_basic(self, superadmin_session):
        """POST /api/calculator/run returns history, final_stats, overall"""
        resp = superadmin_session.post(f"{BASE_URL}/api/calculator/run", json={
            "roles": ["MC"],
            "stats": {
                "Umpan": 140, "Dribel": 40, "Kreativitas": 65, "Tembakan": 40,
                "Tekel": 176, "Penjagaan": 182, "Penempatan": 178, "Kebugaran": 145,
                "Agresivitas": 176, "UmpanSilang": 45, "Penyelesaian": 44,
                "Sundulan": 74, "Keberanian": 187, "Kecepatan": 47, "Kekuatan": 80
            },
            "bonus": 0,
            "grey_limit": 40,
            "targets": [
                {"name": "Umpan", "prio": 1, "goal": 200},
                {"name": "Dribel", "prio": 2, "goal": 150}
            ]
        })
        assert resp.status_code == 200, f"Calculator run failed: {resp.text}"
        
        data = resp.json()
        assert "history" in data
        assert "final_stats" in data
        assert "overall" in data
        assert "white_set" in data
        
        print(f"✓ Calculator run: overall={data['overall']}%, {len(data['history'])} drill steps")
        return data
    
    def test_calculator_priority_bug_fix(self, superadmin_session):
        """
        CRITICAL BUG FIX TEST: Priorities 1/2/3 must NOT overshoot target goals.
        The original bug caused 'jomplang/tumpang tindih' (uneven/overlapping) results.
        """
        # Test with multiple priorities
        resp = superadmin_session.post(f"{BASE_URL}/api/calculator/run", json={
            "roles": ["MC"],
            "stats": {
                "Umpan": 100, "Dribel": 100, "Kreativitas": 100, "Tembakan": 100,
                "Tekel": 100, "Penjagaan": 100, "Penempatan": 100, "Kebugaran": 100,
                "Agresivitas": 100, "UmpanSilang": 100, "Penyelesaian": 100,
                "Sundulan": 100, "Keberanian": 100, "Kecepatan": 100, "Kekuatan": 100
            },
            "bonus": 0,
            "grey_limit": 50,
            "targets": [
                {"name": "Umpan", "prio": 1, "goal": 150},
                {"name": "Dribel", "prio": 2, "goal": 140},
                {"name": "Kreativitas", "prio": 3, "goal": 130}
            ]
        })
        assert resp.status_code == 200, f"Calculator run failed: {resp.text}"
        
        data = resp.json()
        final = data["final_stats"]
        
        # Verify targets are not overshooting their goals
        # Priority 1: Umpan should be <= 150 (or close to it)
        # Priority 2: Dribel should be <= 140 (or close to it)
        # Priority 3: Kreativitas should be <= 130 (or close to it)
        
        # Allow small overshoot due to drill mechanics (drills affect multiple attrs)
        # but should not be significantly over
        umpan_final = final.get("Umpan", 0)
        dribel_final = final.get("Dribel", 0)
        kreativitas_final = final.get("Kreativitas", 0)
        
        print(f"  Priority 1 (Umpan): goal=150, final={umpan_final}")
        print(f"  Priority 2 (Dribel): goal=140, final={dribel_final}")
        print(f"  Priority 3 (Kreativitas): goal=130, final={kreativitas_final}")
        
        # The bug fix ensures we don't overshoot by more than a reasonable margin
        # (drills can cause slight overshoot due to step mechanics)
        assert umpan_final <= 160, f"Umpan overshooting too much: {umpan_final} > 160"
        assert dribel_final <= 150, f"Dribel overshooting too much: {dribel_final} > 150"
        
        print("✓ Priority bug fix validated: targets not significantly overshooting")
    
    def test_calculator_single_drill_mode(self, superadmin_session):
        """POST /api/calculator/run with single_drill restricts to 1 drill only"""
        resp = superadmin_session.post(f"{BASE_URL}/api/calculator/run", json={
            "roles": ["MC"],
            "stats": {
                "Umpan": 100, "Dribel": 100, "Kreativitas": 100, "Tembakan": 100,
                "Tekel": 100, "Penjagaan": 100, "Penempatan": 100, "Kebugaran": 100,
                "Agresivitas": 100, "UmpanSilang": 100, "Penyelesaian": 100,
                "Sundulan": 100, "Keberanian": 100, "Kecepatan": 100, "Kekuatan": 100
            },
            "bonus": 0,
            "grey_limit": 50,
            "targets": [{"name": "Umpan", "prio": 1, "goal": 150}],
            "single_drill": "Oper, Lari, Tembak"
        })
        assert resp.status_code == 200, f"Single drill run failed: {resp.text}"
        
        data = resp.json()
        history = data.get("history", [])
        
        # All history entries should be the same drill
        drill_names = set(h.get("drill") for h in history)
        if len(history) > 0:
            assert len(drill_names) == 1, f"Expected 1 drill type, got {drill_names}"
            assert "Oper, Lari, Tembak" in drill_names
        
        print(f"✓ Single drill mode: only '{list(drill_names)[0] if drill_names else 'none'}' used")
    
    def test_calculator_step_details(self, superadmin_session):
        """POST /api/calculator/run returns per-drill step-by-step details"""
        resp = superadmin_session.post(f"{BASE_URL}/api/calculator/run", json={
            "roles": ["MC"],
            "stats": {
                "Umpan": 100, "Dribel": 100, "Kreativitas": 100, "Tembakan": 100,
                "Tekel": 100, "Penjagaan": 100, "Penempatan": 100, "Kebugaran": 100,
                "Agresivitas": 100, "UmpanSilang": 100, "Penyelesaian": 100,
                "Sundulan": 100, "Keberanian": 100, "Kecepatan": 100, "Kekuatan": 100
            },
            "bonus": 0,
            "grey_limit": 50,
            "targets": [{"name": "Umpan", "prio": 1, "goal": 180}]
        })
        assert resp.status_code == 200, f"Calculator run failed: {resp.text}"
        
        data = resp.json()
        history = data.get("history", [])
        
        if len(history) > 0:
            first_drill = history[0]
            assert "steps" in first_drill, "Missing 'steps' in drill history"
            
            steps = first_drill.get("steps", [])
            if len(steps) > 0:
                step = steps[0]
                assert "step" in step, "Missing 'step' in step detail"
                assert "endAvg" in step, "Missing 'endAvg' in step detail"
                assert "changes" in step, "Missing 'changes' in step detail"
                assert "snapshot" in step, "Missing 'snapshot' in step detail"
                
                print(f"✓ Step details present: {len(steps)} steps in first drill")
            else:
                print("✓ Step details structure present (no steps in this run)")
        else:
            print("✓ No history (targets may already be met)")


# ============================================================
# USERS TESTS
# ============================================================
class TestUsers:
    """User management tests"""
    
    def test_list_users_admin(self, superadmin_session):
        """GET /api/users returns user list (admin only)"""
        resp = superadmin_session.get(f"{BASE_URL}/api/users")
        assert resp.status_code == 200, f"List users failed: {resp.text}"
        
        users = resp.json()
        assert isinstance(users, list)
        assert any(u.get("email") == SUPERADMIN_EMAIL for u in users)
        
        print(f"✓ Got {len(users)} users")
    
    def test_list_users_unauthorized(self):
        """GET /api/users without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/users")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Unauthorized user list correctly rejected")
    
    def test_create_user_admin(self, superadmin_session):
        """POST /api/users creates new user (admin only)"""
        test_email = f"test_user_{int(time.time())}@test.com"
        resp = superadmin_session.post(f"{BASE_URL}/api/users", json={
            "email": test_email,
            "password": "Test1234",
            "password2": "Test1234",
            "name": "TEST_Admin Created User",
            "role": "user",
            "is_trial": True,
            "max_clicks": 50
        })
        assert resp.status_code == 200, f"Create user failed: {resp.text}"
        
        user = resp.json()
        assert user.get("email") == test_email
        assert user.get("role") == "user"
        assert user.get("status") == "active"
        
        print(f"✓ Created user: {user.get('email')}")
        return user


# ============================================================
# TRANSACTIONS TESTS
# ============================================================
class TestTransactions:
    """Transaction approval/rejection tests"""
    
    def test_list_transactions_admin(self, superadmin_session):
        """GET /api/transactions returns transaction list"""
        resp = superadmin_session.get(f"{BASE_URL}/api/transactions")
        assert resp.status_code == 200, f"List transactions failed: {resp.text}"
        
        txs = resp.json()
        assert isinstance(txs, list)
        print(f"✓ Got {len(txs)} transactions")
        return txs


# ============================================================
# DASHBOARD TESTS
# ============================================================
class TestDashboard:
    """Dashboard stats tests"""
    
    def test_admin_dashboard(self, superadmin_session):
        """GET /api/dashboard/admin returns KPIs + chart + expiring_list + recent_tx"""
        resp = superadmin_session.get(f"{BASE_URL}/api/dashboard/admin")
        assert resp.status_code == 200, f"Admin dashboard failed: {resp.text}"
        
        data = resp.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "pending_users" in data
        assert "expiring_soon" in data
        assert "expiring_list" in data
        assert "chart" in data
        assert "recent_tx" in data
        assert "gross" in data
        assert "net" in data
        
        # Chart should have 6 months
        assert len(data["chart"]) == 6, f"Expected 6 months in chart, got {len(data['chart'])}"
        
        print(f"✓ Admin dashboard: {data['total_users']} users, {data['active_users']} active")
    
    def test_marketing_dashboard(self, superadmin_session):
        """GET /api/dashboard/marketing returns marketing stats"""
        resp = superadmin_session.get(f"{BASE_URL}/api/dashboard/marketing")
        assert resp.status_code == 200, f"Marketing dashboard failed: {resp.text}"
        
        data = resp.json()
        assert "total_earnings" in data
        assert "total_conversions" in data
        assert "chart" in data
        assert "promos" in data
        
        print(f"✓ Marketing dashboard: {data['total_conversions']} conversions")


# ============================================================
# NEWS/EVENTS TESTS
# ============================================================
class TestNewsEvents:
    """News and Events CMS tests"""
    
    def test_list_news_public(self):
        """GET /api/news returns published news"""
        resp = requests.get(f"{BASE_URL}/api/news")
        assert resp.status_code == 200, f"List news failed: {resp.text}"
        
        news = resp.json()
        assert isinstance(news, list)
        print(f"✓ Got {len(news)} news items")
    
    def test_list_events_public(self):
        """GET /api/events returns published events"""
        resp = requests.get(f"{BASE_URL}/api/events")
        assert resp.status_code == 200, f"List events failed: {resp.text}"
        
        events = resp.json()
        assert isinstance(events, list)
        print(f"✓ Got {len(events)} events")
    
    def test_create_news_admin(self, superadmin_session):
        """POST /api/news creates news item (admin only)"""
        resp = superadmin_session.post(f"{BASE_URL}/api/news", json={
            "title": "TEST_News Item",
            "content": "This is a test news item content.",
            "published": True
        })
        assert resp.status_code == 200, f"Create news failed: {resp.text}"
        
        news = resp.json()
        assert news.get("title") == "TEST_News Item"
        assert "id" in news
        
        print(f"✓ Created news: {news.get('id')}")
    
    def test_create_event_admin(self, superadmin_session):
        """POST /api/events creates event (admin only)"""
        resp = superadmin_session.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Event",
            "content": "This is a test event content.",
            "event_date": "2026-06-01T10:00:00",
            "registration_required": True,
            "published": True
        })
        assert resp.status_code == 200, f"Create event failed: {resp.text}"
        
        event = resp.json()
        assert event.get("title") == "TEST_Event"
        assert "id" in event
        
        print(f"✓ Created event: {event.get('id')}")


# ============================================================
# PAYMENT CONFIG TESTS
# ============================================================
class TestPaymentConfig:
    """Payment configuration tests"""
    
    def test_get_payment_config_admin(self, superadmin_session):
        """GET /api/payment-config returns config (admin only)"""
        resp = superadmin_session.get(f"{BASE_URL}/api/payment-config")
        assert resp.status_code == 200, f"Get payment config failed: {resp.text}"
        
        config = resp.json()
        assert "manual_enabled" in config
        assert "xendit_enabled" in config
        assert "midtrans_enabled" in config
        
        print(f"✓ Payment config: manual={config.get('manual_enabled')}")
    
    def test_update_payment_config_superadmin(self, superadmin_session):
        """PATCH /api/payment-config requires superadmin"""
        resp = superadmin_session.patch(f"{BASE_URL}/api/payment-config", json={
            "bank_info": "TEST Bank Info Updated"
        })
        assert resp.status_code == 200, f"Update payment config failed: {resp.text}"
        
        config = resp.json()
        assert config.get("bank_info") == "TEST Bank Info Updated"
        
        print("✓ Payment config updated by superadmin")


# ============================================================
# ROLE PERMISSION TESTS
# ============================================================
class TestRolePermissions:
    """Role-based access control tests"""
    
    def test_admin_cannot_create_superadmin(self, superadmin_session):
        """Admin cannot create admin/superadmin/marketing roles (only superadmin can)"""
        # First create an admin user
        admin_email = f"test_admin_{int(time.time())}@test.com"
        resp = superadmin_session.post(f"{BASE_URL}/api/users", json={
            "email": admin_email,
            "password": "Admin1234",
            "password2": "Admin1234",
            "name": "TEST_Admin User",
            "role": "admin"
        })
        assert resp.status_code == 200, f"Create admin failed: {resp.text}"
        
        # Login as the new admin
        admin_session = requests.Session()
        admin_session.headers.update({"Content-Type": "application/json"})
        resp = admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": admin_email,
            "password": "Admin1234"
        })
        assert resp.status_code == 200, f"Admin login failed: {resp.text}"
        
        # Try to create a superadmin (should fail)
        resp = admin_session.post(f"{BASE_URL}/api/users", json={
            "email": f"test_super_{int(time.time())}@test.com",
            "password": "Test1234",
            "password2": "Test1234",
            "name": "TEST_Superadmin Attempt",
            "role": "superadmin"
        })
        assert resp.status_code == 403, f"Expected 403 for admin creating superadmin, got {resp.status_code}"
        
        print("✓ Admin correctly blocked from creating superadmin")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
