# TE Sniper Calculator — Product Requirements Document

## Original Problem Statement
User had a single HTML page Top Eleven training calculator. Requested:
1. Bug fix: priority logic overshoot
2. Single drill mode
3. Step-by-step drill details
4. Full SaaS dashboard transformation
5. Multi-role auth (superadmin, admin, marketing, user)
6. Registration with 2nd password + association + package + promo
7. Promo codes (% or flat)
8. Packages (monthly/yearly)
9. Manual approval + Xendit/Midtrans placeholder
10. Free-trial accounts (time/click limited)
11. Admin dashboard with charts
12. Marketing role with commission dashboard
13. News + Events CMS
14. **Tactical Edge redesign** — Dark `#0B0C10` + Electric Blue `#00A8FF` + Red `#E50914` aesthetic per provided zip
15. Multi-page public site with Navigation + Footer wrapping login/register

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor) + bcrypt + PyJWT
- **Frontend**: React 19 + React Router 7 + TailwindCSS + GSAP + Framer Motion + Phosphor Icons + Recharts

## User Personas
- **Guest**: 6 public pages (Home, About, Services, Tools, Community, Contact)
- **User** (free-trial or paid): runs calculator, views account expiry
- **Marketing**: creates promos, tracks commission
- **Admin**: approves transactions/events, manages CRUD, KPIs
- **Superadmin**: everything + role/payment config

## Core Requirements (static)
- JWT auth via httpOnly cookies
- bcrypt + brute-force lockout
- Calculator respects 180% avg + grey-attribute + goal cap on ALL targets

## What's Been Implemented

### MVP (2026-01-18)
- Full backend RBAC + frontend dashboards + calculator
- News/Events CMS + payment config
- Top Eleven theme (navy/gold)

### Iteration 2 (2026-01-19) — Indo Timezone Rebrand
- ITZ logo, palette to navy+gold dominant
- Calculator split: Full Latihan, Single Drill, GK
- Tagline "Unity in Time — We Suffer, We Grow, We Achieve"

### Iteration 3 (2026-01-19) — Mobile UX
- Hamburger menu, ResponsiveTable, mobile-friendly forms

### Iteration 4-7 — Background, Badge, Sidebar
- Watermark → radial gradient
- Sidebar position:fixed
- Emergent badge hidden

### Iteration 8 (2026-01-XX) — Tactical Edge Theme
- Bulk color migration from navy/gold to dark + electric blue + red

### Iteration 9-10 (2026-02-09) — Public Site Multi-Page Redesign ⭐ LATEST
- **GSAP installed** (`gsap@3.15.0`) for animations
- New folder `/components/public/` with: Navigation, Footer, Preloader, ScrollReveal, HeroSection, FootballPitchCanvas, PublicLayout
- New folder `/pages/public/` with 6 pages: Home, About, Services, Tools, Community, Contact
- **Animated football pitch canvas** on Home (11v11 player movement + ball passing + goal celebration particles)
- **GSAP timeline entrance** + **ScrollTrigger** reveal animations
- **Preloader** on first load (sessionStorage gated)
- **Sticky Navigation** with scroll-blur transition + mobile fullscreen menu
- **4-column Footer** with social icons
- Login & Register now wrapped in `PublicLayout` (have nav+footer)
- **Services page**: 4 service slots (Tactical Sniper, Formation Lab, Training Analytics, Association Toolkit) with **dynamic pricing from `/api/packages`**
- **Community page**: dynamic events from `/api/events`
- Cleaned up duplicate TEST_Premium Package documents from DB
- Frontend testing agent: **100% PASS** (iteration_10.json)

## Prioritized Backlog (P0/P1/P2)
- **P1** — Xendit/Midtrans payment gateway integration (need API keys)
- **P1** — News/Event detail public pages (currently only landing preview)
- **P1** — Forgot-password flow
- **P1** — User event registration page in dashboard
- **P2** — Profile edit page (password, 2nd password, association)
- **P2** — Search/filter on user & transaction tables
- **P2** — Email notifications (approval/rejection)
- **P2** — Copy share link for calculator results

## Cleanup Needed
- Remove unused `/app/frontend/src/pages/Landing.js` (replaced by `pages/public/Home.js`)

## Deployment Notes
- Supervisor: backend :8001, frontend :3000
- MongoDB: `te_sniper_db`
- `REACT_APP_BACKEND_URL` for all API calls
