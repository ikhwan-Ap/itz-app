# AGENT_EXECUTION_RULES.md

> Project: ITZ-App — Indo Timezone Tactical Edge  
> Purpose: Membuat AI Agent bisa melanjutkan pengerjaan otomatis berdasarkan `UPDATE_MD.md` dan `update-execution-tracker.md`.

---

# 1. Mission

You are the execution agent for ITZ-App.

Your job is to continue implementing the update plan based on these documents:

1. `system_map.md`
2. `UPDATE_MD.md`
3. `update-execution-tracker.md`
4. `CURRENT_AGENT_STATE.md`
5. `AGENT_EXECUTION_RULES.md`

You must work task-by-task without asking the user after every task.

---

# 2. Main Rule

Do not start new product features before fixing existing issues from `system_map.md`.

Execution order:

1. System Map Cleanup & Existing Issues
2. Immediate Fixes from system_map.md
3. Phase 1 — Stabil & Trust
4. Phase 2 — Product Value
5. Phase 3 — Monetisasi
6. Phase 4 — Growth

Never jump to a later phase while earlier Critical or High priority tasks are still `NOT_STARTED` or `IN_PROGRESS`.

---

# 3. Autonomous Continue Rule

After completing one task:

1. Update `update-execution-tracker.md`
2. Update `CURRENT_AGENT_STATE.md`
3. Run relevant verification
4. If verification passes, continue to the next task
5. If verification fails, fix it
6. If still blocked, mark the task as `BLOCKED`
7. Continue to the next safe task

Do not stop after one completed task.

---

# 4. Work Batch Rule

Work in batches of 3 tasks.

For each batch:

1. Pick the next 3 eligible tasks from the tracker
2. Complete them one by one
3. Verify each task
4. Update tracker and current state
5. Write a short batch summary
6. Continue automatically to the next batch unless blocked

If a task is risky, do only that task in the batch.

---

# 5. Task Selection Rule

Always pick the next task using this priority:

1. Status must be `NOT_STARTED`
2. Earlier phase first
3. Higher priority first
4. Lower risk first
5. Fewer dependencies first

Priority order:

1. Critical
2. Very High
3. High
4. Medium-High
5. Medium
6. Medium-Low
7. Low

---

# 6. Status Rules

Use only these statuses:

| Status | Meaning |
|---|---|
| NOT_STARTED | Belum dikerjakan |
| IN_PROGRESS | Sedang dikerjakan |
| BLOCKED | Terhambat |
| NEED_REVIEW | Butuh review manual |
| DONE | Selesai |
| SKIPPED | Dilewati dengan alasan jelas |

A task can only be marked `DONE` if:

1. File changes are complete
2. Verification is complete
3. No known breaking issue exists
4. Tracker is updated
5. Current state is updated

---

# 7. Stop Conditions

Only stop and ask the user if:

1. A real secret/API key/password is required
2. A destructive database operation is required
3. A production command may delete data
4. DNS/Cloudflare setting must be changed
5. Payment credential or real payment provider config is required
6. Pricing/package business decision is unclear
7. Server access is unavailable
8. The app fails build/test after reasonable fix attempts
9. A migration could break existing user data
10. The task requires a product decision from owner

When stopping, provide:

- Completed tasks
- Blocked task ID
- Exact reason
- Exact error or missing information
- Recommended next action

---

# 8. Do Not Ask Confirmation For

You do not need user confirmation for:

- Updating documentation
- Updating `system_map.md`
- Updating `update-execution-tracker.md`
- Updating `CURRENT_AGENT_STATE.md`
- Adding missing navigation item
- Adding missing route entry
- Adding `.env.example` placeholder keys
- Removing unused imports after verification
- Removing unused file after verifying no references
- Adding non-destructive backend endpoint
- Adding frontend page/component
- Adding pagination to list endpoint
- Adding audit log helper
- Running local build/test
- Running safe read-only server checks

---

# 9. Must Ask Before

You must ask before:

- Dropping MongoDB collections
- Deleting production user data
- Changing real secrets
- Changing payment credentials
- Changing DNS/Cloudflare configuration
- Removing `.git` from server
- Increasing Uvicorn workers above 1
- Binding backend to `0.0.0.0` in production
- Changing pricing logic
- Changing commission percentage
- Running destructive migration
- Removing large feature without replacement

---

# 10. Production Safety Rules

These rules are mandatory:

1. Do not delete `.git` on server
2. Do not commit `.env`
3. Do not expose secrets
4. Do not increase Uvicorn workers on small VPS
5. Backend production must bind to `127.0.0.1:8000`
6. Nginx must proxy `/api/` to `http://127.0.0.1:8000`
7. UFW must deny direct public access to port 8000
8. `.git` public access must return 404 or 403
9. `.env` public access must return 404 or 403
10. Do not run frontend build on server unless explicitly required
11. Frontend build is created locally and committed
12. Server deploy uses `git pull origin main`
13. Avoid heavy dependency additions because VPS memory is small
14. Prefer small incremental changes

---

# 11. Verification Rules

## 11.1 After Backend Changes

Run relevant checks:

- Backend starts successfully
- No syntax/import error
- Affected endpoint works
- `/api/calculator/meta` still works
- Auth-related endpoint still works if touched
- MongoDB connection still works if DB touched

Recommended checks:

- `python -m py_compile`
- backend test suite if available
- API smoke test

---

## 11.2 After Frontend Changes

Run relevant checks:

- Build succeeds
- No broken imports
- Route exists
- Protected route behavior works
- Navigation item appears
- No console-breaking issue from obvious code mistakes

Recommended check:

- `npm run build`

---

## 11.3 After Server/Nginx Changes

Run relevant checks:

- `sudo nginx -t`
- `sudo systemctl reload nginx`
- `sudo systemctl status itz-backend`
- `ss -tlnp | grep 8000`
- `curl -I https://indotimezone.store/api/calculator/meta`
- `curl -I https://indotimezone.store/.git/config`
- `curl -I https://indotimezone.store/.env`

Expected:

- API returns 200
- `.git/config` returns 404 or 403
- `.env` returns 404 or 403
- port 8000 listens only on `127.0.0.1`

---

# 12. Tracker Update Format

Every completed task must update tracker like this:

```md
| SYS-01 | Update system_map.md sesuai kondisi terbaru production | Critical | DONE | Updated worker policy, .env permission, .git policy, deployment policy. Verified docs only. |