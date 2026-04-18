# TE Sniper Calculator — Product Requirements Document

## Original Problem Statement
User had a single HTML page for a Top Eleven (football manager game) training calculator. They requested:
1. **Bug fix**: Priority 2 and 3 targets produced uneven/overlapping ("jomplang/tumpang tindih") results — drills overshot target goals.
2. **Feature**: Option to run single drill only (not full search).
3. **Feature**: Show per-drill step-by-step details during execution (not only at the end).
4. Transform into a full SaaS dashboard with **Top Eleven** color theme (navy + stadium green + gold).
5. Multi-role auth: **superadmin, admin, marketing, user**.
6. Registration flow: email + password + 2nd password + association (optional) + package + promo code.
7. Promo codes: percent or flat discount.
8. Packages: monthly or yearly.
9. Manual approval for registration/payment + placeholder for Xendit/Midtrans (future auto-payment).
10. Free-trial accounts: time-limited OR max-click-limited.
11. Admin dashboard: transaction charts, active users, expiring users, popup notifications.
12. Marketing role: earns commission from promo discounts, has own dashboard + charts.
13. News + Events CMS (dynamic pages) with event registration + admin approval.

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver) + bcrypt + PyJWT
- **Frontend**: React 19 + React Router + TailwindCSS + shadcn/ui + framer-motion + @phosphor-icons/react + recharts

## User Personas
- **Guest**: browses landing, news, events, packages → registers.
- **User** (free-trial or paid): runs calculator, views account expiry.
- **Marketing**: creates own promo codes, tracks commission earnings.
- **Admin**: approves transactions/event-registrations, manages users/news/events, views KPIs.
- **Superadmin**: everything admin can do + manage roles, assign marketers, edit payment config.

## Core Requirements (static)
- JWT auth via httpOnly cookies (samesite=none, secure for preview HTTPS).
- bcrypt password hashing, brute-force lockout (5 attempts → 15 min).
- Every MongoDB collection indexed; id fields use UUID.
- Calculator: respects 180% avg cap + grey-attribute limit + goal cap on ALL targets simultaneously.

## What's Been Implemented (2026-01-18 — MVP)
- ✅ Seeded superadmin on startup + 3 default packages + `WELCOME20` promo
- ✅ Auth: register (→ pending), login, logout, me, refresh; cookies + RBAC
- ✅ Users CRUD (admin), trial accounts with click-limit/time-limit
- ✅ Packages CRUD
- ✅ Promo codes CRUD (marketing owns theirs; admins own all)
- ✅ Promo validation endpoint (dry-run discount calc)
- ✅ Transactions: auto-created on register, admin approve/reject workflow
- ✅ News/Events CMS with published flag
- ✅ Event registration + approval workflow
- ✅ Payment config storage (manual + Xendit/Midtrans placeholders)
- ✅ Admin dashboard with KPIs + 6-month revenue chart + expiring list
- ✅ Marketing dashboard with commission chart + own promo stats
- ✅ **Calculator bug fix**: simulator now respects goal cap of ALL targets at every drill step, eliminating priority overshoot
- ✅ **Single-drill mode**: filters drills pool to one
- ✅ **Per-drill step details**: history[i].steps[] with snapshot+delta
- ✅ Landing page with hero, features, packages, news, events
- ✅ Top Eleven theme: navy `#0B1221` + stadium-green `#00D05E` + gold `#F5C300`, Barlow Condensed + Manrope fonts, stadium-noise grain
- ✅ Protected routes by role
- ✅ Expiry/trial popups on user dashboard
- ✅ 100% backend test pass (30/30) + all frontend flows verified

## Prioritized Backlog (P0/P1/P2)
- **P1** — Forgot-password flow (endpoint stub exists in playbook, not yet implemented)
- **P1** — Event registrations page on user dashboard (list + status)
- **P1** — Public news/event detail pages (currently only landing preview)
- **P2** — Real Xendit/Midtrans integration when user provides keys
- **P2** — User profile edit page (change password, 2nd password, association)
- **P2** — Search/filter on user & transaction tables
- **P2** — Email notifications on approval/rejection

## Next Tasks
1. User asks for feature X → iterate quickly with search_replace
2. If user provides Xendit/Midtrans API keys → activate integration (playbook call needed)
3. Forgot-password flow (if user requests)

## Deployment Notes
- Supervisor manages backend (:8001) and frontend (:3000)
- Frontend uses `REACT_APP_BACKEND_URL` for all API calls with `withCredentials`
- MongoDB: single database `te_sniper_db`
