# Backend Refactoring Plan

> Goal: Split `server.py` (1600+ lines) into route modules without breaking production.  
> Approach: Iterative — extract one router at a time, test after each.  
> Test baseline: existing `tests/test_api.py` (651 lines) + smoke checks.

---

## Target Structure

```
backend/
├── server.py              → app init + startup events only (~80 lines)
├── core/
│   ├── __init__.py
│   ├── config.py          → env loading, mongo client
│   ├── deps.py            → current_user, require_role, _is_admin
│   ├── audit.py           → _audit_log helper
│   ├── notify.py          → _create_notification helper
│   ├── streak.py          → _update_streak helper
│   ├── ratelimit.py       → _rate_check
│   └── pagination.py      → _paginate_meta
├── routes/
│   ├── __init__.py
│   ├── health.py          → /health, /health/db
│   ├── auth.py            → /auth/* (register, login, logout, refresh, me, forgot, reset)
│   ├── calculator.py      → /calculator/*
│   ├── training.py        → /training-results/*
│   ├── users.py           → /users/* (admin)
│   ├── packages.py        → /packages/*
│   ├── promos.py          → /promos/*
│   ├── transactions.py    → /transactions/*
│   ├── cms.py             → /news/*, /events/*, /event-registrations/*
│   ├── dashboard.py       → /dashboard/*
│   ├── notifications.py   → /notifications/*
│   └── payment_config.py  → /payment-config/*
├── auth.py                → KEEP (existing JWT/password helpers)
├── calculator.py          → KEEP (existing simulator)
├── models.py              → KEEP (Pydantic models)
└── tests/                 → existing
```

---

## Phases

### Phase 1: Foundation (no code moves)
- [x] Plan documented
- [x] Create `core/` and `routes/` folders with `__init__.py`
- [x] Extract `routes/health.py` (proof of concept)
- [x] Verify production endpoints still work (baseline smoke test)
- [x] Baseline commit: `426d05b`

### Phase 2: Extract `core/` helpers
- [ ] `core/config.py` — env, mongo client, app instance
- [ ] `core/deps.py` — auth dependencies
- [ ] `core/audit.py` — audit log helper
- [ ] `core/ratelimit.py` — rate limit
- [ ] `core/pagination.py` — pagination meta
- [ ] After each: `pytest`, deploy, smoke test

### Phase 3: Extract routes one-by-one (smallest first)
1. [ ] `health.py` (2 endpoints) — safest, lowest risk
2. [ ] `notifications.py` (4 endpoints)
3. [ ] `payment_config.py` (2 endpoints)
4. [ ] `cms.py` (8 endpoints — news, events, registrations)
5. [ ] `dashboard.py` (3 endpoints)
6. [ ] `calculator.py` route (2 endpoints)
7. [ ] `training.py` (5 endpoints)
8. [ ] `transactions.py` (3 endpoints)
9. [ ] `promos.py` (5 endpoints)
10. [ ] `packages.py` (4 endpoints)
11. [ ] `users.py` (4 endpoints — most complex auth checks)
12. [ ] `auth.py` route (last — most critical, most tested)

### Phase 4: Cleanup
- [ ] Reduce `server.py` to only app init + router includes
- [ ] Update tests to import from new structure
- [ ] Final smoke test
- [ ] Update IMPROVEMENT_TRACKER.md

---

## Test Strategy Per Phase

After each extraction:
1. Local: `pytest backend/tests/test_api.py -v` against running backend
2. Deploy to server: `git push` + `git pull` + `systemctl restart`
3. Smoke test: hit each endpoint via curl
4. Verify frontend still works (manual: open site, login, run calculator)

---

## Rollback Strategy

Each commit = one extraction. If something breaks:
```bash
git revert HEAD
git push origin main
ssh server: git pull && systemctl restart itz-backend
```

Server `.git` always tracks main, so rollback is immediate.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Circular imports | Use `core/` for shared helpers, routes only import from core |
| Forgotten routes | Diff route count before/after |
| Auth dependency lost | Test each protected endpoint after move |
| Production downtime | Each commit is isolated, rollback = 30 sec |
| Frontend breaks | Test frontend manually after each phase |

---

## Next Session Continuation Guide

**Baseline state (commit `426d05b`):**
- `backend/core/__init__.py` — empty placeholder
- `backend/routes/__init__.py` — empty placeholder
- `backend/routes/health.py` — extracted, working in production
- `backend/server.py` — still has ~1550 lines (everything except health)

**Pattern proven** with `routes/health.py`:
1. Create `routes/<name>.py` with `init_<name>_routes(deps...)` factory function
2. Factory takes `client`, `db`, and any other shared state, returns `APIRouter`
3. In `server.py`: `from routes.<name> import init_<name>_routes` then `api.include_router(init_<name>_routes(...))`
4. Delete the old endpoints from `server.py`
5. Commit, deploy, smoke test

**Per-module deployment checklist:**
```bash
# Lokal
git add backend/routes/<name>.py backend/server.py
git commit -m "refactor: extract <name> routes to routes/<name>.py"
git push origin main

# Server
ssh itzadmin@itz-prod "cd /var/www/itz-app && sudo git pull origin main && sudo systemctl restart itz-backend"

# Verify
curl https://indotimezone.store/api/<endpoint>  # quick smoke
```

**Order to extract (from safest to riskiest):**
1. `notifications.py` — 3 endpoints, shared helper `_create_notification` should move to `core/notify.py` (used by auth, transactions, events)
2. `payment_config.py` — 2 endpoints, isolated
3. `cms.py` — 8 endpoints (news + events + event-registrations)
4. `dashboard.py` — 3 endpoints, depends on transactions/users data
5. `calculator.py` route — 2 endpoints, also need `_update_streak` to move to `core/streak.py`
6. `training.py` — 5 endpoints, uses `max_history` config
7. `transactions.py` — 3 endpoints, uses `_create_notification`, `_audit_log`
8. `promos.py` — 5 endpoints, uses `_audit_log`
9. `packages.py` — 4 endpoints
10. `users.py` — 4 endpoints, uses `_audit_log`
11. `auth_routes.py` — 7 endpoints (LAST — most critical, includes register/login/forgot)

**Helpers to extract to `core/`:**
- `_audit_log` → `core/audit.py` (used by users, transactions, promos, password reset)
- `_create_notification` → `core/notify.py` (used by auth register, transactions, events)
- `_update_streak` → `core/streak.py` (used by calculator)
- `_rate_check` → `core/ratelimit.py` (used by calculator, promos validate, register)
- `_paginate_meta` → `core/pagination.py` (used by all list endpoints)
- `current_user`, `require_role`, `_is_admin`, `_parse_dt`, `_sanitize_user` → `core/deps.py`

**Estimated remaining work:** 30-40 minutes if no errors. Each module = 1 commit + 1 deploy + 1 smoke test.
