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
- [ ] Create `core/` and `routes/` folders with `__init__.py`
- [ ] Verify production endpoints still work (baseline smoke test)

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
