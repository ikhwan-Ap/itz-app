# 🚀 Dashboard Future Features — From "Tactical Center" Design Reference

> **Source**: `Kimi_Agent_Dashboard Sesuai Frontend.zip` (uploaded 2026-02-09)
> **Status**: Visual layer DONE. Below are concept / feature-level items not yet wired to backend or not yet implemented.

---

## ✅ SUDAH SELESAI (this iteration)

| Status | Item |
|--------|------|
| ✅ | Collapsible sidebar 260px ↔ 72px dengan animasi framer-motion |
| ✅ | Active item indicator (3px cyan vertical bar) + layoutId animation |
| ✅ | Fixed top bar (h-16) dengan blur background |
| ✅ | Logo gradient ITZ "Tactical Center" di sidebar |
| ✅ | Profile dropdown (avatar, name, role, email, logout) |
| ✅ | Page transition `AnimatePresence` (opacity + y slide) |
| ✅ | Welcome banner dengan pitch grid overlay + greeting + action buttons |
| ✅ | StatCard reusable dengan progress bar animation |
| ✅ | Card design: `bg-#16161d` + `border-white/[0.06]` + hover `cyan-glow + lift` |
| ✅ | Recharts tooltip & legend di-restyle ke dark theme |
| ✅ | Mobile drawer dengan logo + nav + bottom actions |
| ✅ | localStorage persistence untuk sidebar collapsed state |

Pages refreshed:
- `UserOverview.js` — WelcomeBanner + 3 StatCards (Package/Expires/Clicks dengan progress) + 2 Training Module cards + Tips
- `AdminDashboard.js` — WelcomeBanner + 4 KPI users + 4 KPI financial + 2 charts + expiring + recent transactions
- `MarketingDashboard.js` — WelcomeBanner + 3 KPIs + Earnings Trend + Conversions Bar + Promo table + Recent conversions

---

## ⏳ FITUR DARI DESIGN — BELUM DI-IMPLEMENT (TODO)

### 🔴 P1 — High Value, mudah diintegrasikan ke backend yang sudah ada

#### F1. Cmd+K Command Palette
- **Source design**: `src/components/ui-custom/CommandPalette.tsx`
- **Konsep**: Modal search global (`⌘K` shortcut) untuk navigasi cepat ke any page, search user, search transaction, jump to training
- **Backend tidak butuh perubahan** — pure frontend feature dengan fuzzy search ke nav items + GET `/api/users` + GET `/api/transactions`
- **Status**: ⏳ TODO. Tombol `topbar-search` sudah ada (placeholder, disabled). Klik harus buka modal.

#### F2. Notifications Panel
- **Source design**: `src/components/ui-custom/NotificationPanel.tsx`
- **Konsep**: Dropdown panel dari icon Bell (top bar) yang menampilkan:
  - User baru menunggu approval (admin)
  - Transaction approved/rejected (user)
  - Akun akan expired dalam X hari
  - New event registered (admin)
- **Backend butuh**:
  - Model baru `Notification { id, user_id, type, title, body, link, read, created_at }`
  - Endpoints: `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`
  - Notification creator hooks di transaction approve, expiry warning cron, dll
- **Status**: ⏳ TODO. Tombol Bell sudah ada dengan dot merah (placeholder, disabled).

#### F3. Streak / Training Consistency Tracker
- **Source design**: `Dashboard.tsx StatCard "Streak"` (12 Hari, progress 75%)
- **Konsep**: Hitung berapa hari berturut-turut user run kalkulator. Reset jika skip 1 hari penuh.
- **Backend butuh**:
  - Field baru di User: `last_training_date`, `current_streak`, `longest_streak`
  - Update di endpoint `/api/calculator/run` dan `/api/calculator/single`
- **Status**: ⏳ TODO. Bisa ganti card Package di UserOverview dengan Streak card.

---

### 🟡 P2 — New Pages (perlu backend baru)

#### F4. Squad page (`/app/squad`)
- **Source design**: `src/pages/Squad.tsx`
- **Konsep**: List pemain user dengan attribute, position, quality. Filter & sort. Drag & drop ke formation.
- **Backend butuh**:
  - Model `Player { id, user_id, name, position, attrs, quality, age, salary, ... }`
  - CRUD `/api/players` + import via screenshot OCR (advanced)
- **Status**: ⏳ Nice-to-have. Investasi besar.

#### F5. Analytics page (`/app/analytics`)
- **Source design**: `src/pages/Analytics.tsx`
- **Konsep**: Multi-line chart progress squad over time, weak position detection, training efficiency score.
- **Backend butuh**:
  - Model `TrainingSession { user_id, drill_id, before_avg, after_avg, gain, timestamp }`
  - Endpoint `GET /api/analytics/squad-progress?range=7d|30d|season`
- **Status**: ⏳ Nice-to-have. Connect ke calculator history.

#### F6. Community page in Dashboard (`/app/community`)
- **Source design**: `src/pages/Community.tsx` (in dashboard) + `Dashboard.tsx CommunityCard`
- **Konsep**: Internal feed komunitas (online manager count, trending topic, weekend tournament slots)
- **Backend butuh**:
  - Live presence tracking (websocket atau polling) untuk count online managers
  - Tournament model + registration slots
- **Status**: ⏳ Bisa diawali dengan static "Community Card" di UserOverview yg link ke public `/community`.

---

### 🟢 P3 — Polish / Nice-to-have

#### F7. Live Pulse Animation
- CSS keyframe `livePulse` di design — sudah ditiru di `index.css` original (`.live-pulse`)
- Aplikasikan ke status indicator (online users, "live tournament", dsb)

#### F8. Activity Feed di User Overview
- Dari `Dashboard.tsx ActivityFeed` — list 4-5 aktivitas terbaru user (training session done, formation saved, promo applied)
- Backend butuh: `GET /api/activity?limit=10` yang aggregate dari berbagai event log

#### F9. Quick Tools Grid di Dashboard
- 4 tool cards (Tactical Sniper Live / Formation Planner Beta / Squad Analyzer Live / Token Tracker Soon)
- Sebagian sudah ada di Public Tools page — dashboard version pakai status pill langsung navigate

#### F10. Date-Range Toggle on Charts
- `7D / 30D / Season` button group di Training chart
- Backend butuh: query param `range` di `/api/dashboard/admin?range=7d`

#### F11. Avatar Group dengan online count
- Stack avatar 4 user terakhir online + "+124 more" pill
- Butuh: presence tracking endpoint

---

## 🗺️ CONCEPT REFERENCE — Konsep Design Yang Bisa Jadi Acuan Pengembangan

| Konsep | Aplikasi ke ITZ |
|--------|-----------------|
| Pitch grid backdrop | Sudah dipakai di Welcome Banner. Bisa dipakai juga di hero section public Home. |
| Gradient avatar (cyan→violet) | Sudah dipakai di Logo + Profile + Welcome. Bisa pakai juga di team grid public About. |
| Progress bar dengan delay animation | Pattern reusable, sudah ada di StatCard. Bagus untuk training simulation visualization. |
| Text [11px] uppercase tracking-wider | Pattern label pattern yang elegan, sudah dipakai. |
| Badge dengan colored dot + status text | Status indicator pattern. Bisa dipakai di Transaction status, User status. |

---

## 📋 RECOMMENDED EXECUTION ORDER

1. ✅ **DONE** — Visual redesign dashboard shell + 3 dashboard pages
2. **Next** — F1 Command Palette (frontend-only, quick win UX)
3. **Next** — F2 Notifications (backend + frontend, high admin value)
4. **Then** — F3 Streak tracker (backend tweak + UserOverview card swap)
5. **Then** — F8 Activity Feed
6. **Long-term** — F4 Squad page, F5 Analytics page, F6 Community feed

---

## 📂 Files Created/Modified This Iteration

**Created**:
- `/app/frontend/src/components/dashboard/StatCard.js`
- `/app/frontend/src/components/dashboard/WelcomeBanner.js`
- `/app/DASHBOARD_FUTURE_FEATURES.md` (this file)

**Modified**:
- `/app/frontend/src/components/DashboardLayout.js` — full rewrite (collapsible sidebar + topbar + profile)
- `/app/frontend/src/pages/UserOverview.js` — full rewrite with new components
- `/app/frontend/src/pages/AdminDashboard.js` — full rewrite with StatCard pattern + restyled charts
- `/app/frontend/src/pages/MarketingDashboard.js` — same pattern
- `/app/frontend/src/index.css` — added `.dashboard-shell` scope tokens

**Untouched (per user request "tactical sniper bagus saat ini")**:
- `/app/frontend/src/pages/training/FullLatihan.js`
- `/app/frontend/src/pages/training/SingleDrill.js`
- `/app/frontend/src/pages/training/GKLatihan.js`
- `/app/frontend/src/pages/TrainingHub.js`
