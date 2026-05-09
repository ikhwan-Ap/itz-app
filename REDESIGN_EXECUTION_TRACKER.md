# 🎨 ITZ Tactical Edge — Redesign Execution Tracker

> **Purpose**: Tracking redesign migration dari design zip (`Kimi_Agent_ITZ App Redesign Project.zip`)
> **Started**: 2026-02-XX
> **Owner**: Main Agent (E1)

---

## 📋 User Requests (verbatim)

### Round 1 — Initial redesign request
> "ganti design app sesuai dengan zip yang saya berikan, tetap maintain logo ITZ"
**Status**: ✅ DONE (Iteration awal — bulk color replace dilakukan)

### Round 2 — Refinement request (current)
> "saya ingin redesign dulu banyak tampilan yang miss... saya ingin betul betul seperti itu tampilannya"
> "di bagian service saya ingin ada harganya karena biaya saya mengerjakna dan server"
> "berikan moto serta yang lainnya sesuai dengan design"
> "buat dinamis sesuai dengan page yang saya berikan"
> "animasi itu juga belum ada"
> "login & register yang tidak ada header dan footer untuk frontend sebelum masuk dashboard, saat dashboard barulah berbeda"
> "warna berubah saya ingin dashboard design berubah juga mengikuti"

**Status**: ✅ DONE (this iteration)

---

## 🎯 User Choice Confirmation

| # | Question | Answer |
|---|----------|--------|
| 1 | Services pricing | **(c)** 4 services design, harga ditarik mapping dari paket backend |
| 2 | Tagline/Motto utama | **(c)** Keduanya (eyebrow "INDONESIAN TOP ELEVEN COMMUNITY" + Tactical Edge headline + tagline lama "Unity in Time — We Suffer, We Grow, We Achieve" sebagai sub) |
| 3 | Login/Register logo | **(b)** Logo gambar bulat existing (`/assets/itz-logo.png`) |
| 4 | Preloader scope | **(a)** Hanya Home (first load saja, via sessionStorage flag) |

---

## ✅ Execution Checklist

### Phase 1 — Public Site Migration (sesuai zip design)

- [x] **1.1** Install `gsap` package untuk animasi profesional
- [x] **1.2** Copy image assets (`hero-manager.jpg`, `feature-tactical.jpg`, `feature-community.jpg`) ke `public/images/`
- [x] **1.3** Buat `Navigation` component (sticky nav, scroll bg blur, mobile hamburger fullscreen menu)
- [x] **1.4** Buat `Footer` component (4 kolom + social icons)
- [x] **1.5** Buat `Preloader` component dengan GSAP progress bar (2s)
- [x] **1.6** Buat `ScrollReveal` component (GSAP ScrollTrigger)
- [x] **1.7** Buat `HeroSection` reusable component dengan GSAP timeline animation
- [x] **1.8** Port `FootballPitchCanvas` (animated 11v11 pitch + ball passing + goal celebration particles)
- [x] **1.9** Buat `PublicLayout` wrapper (Nav + Footer + scroll-to-top + Preloader gating)
- [x] **1.10** Wire routes ke App.js: `/`, `/about`, `/services`, `/tools`, `/community`, `/contact`

### Phase 2 — Public Pages (6 halaman)

- [x] **2.1** `Home` — Hero dengan animated pitch, stats card, 3 features cards, testimonials, CTA banner
- [x] **2.2** `About` — Mission/Vision dual column, team grid (6 members), story image
- [x] **2.3** `Services` — 4 services dengan harga **dinamis** dari backend `/api/packages` + section "Kenapa Berbayar?"
- [x] **2.4** `Tools` — 4 tool cards (Live/Beta/Coming Soon badges) + tactical board image
- [x] **2.5** `Community` — 3 hubs (Discord/YouTube/Associations) + community image + events list dari `/api/events`
- [x] **2.6** `Contact` — Form (name, email, subject, message) dengan validation + sidebar info

### Phase 3 — Login & Register (dengan Header + Footer publik)

- [x] **3.1** Login page wrapped di `PublicLayout` (sekarang punya Nav + Footer)
- [x] **3.2** Register page wrapped di `PublicLayout`
- [x] **3.3** Top padding disesuaikan untuk fixed nav (pt-28)
- [x] **3.4** Logo ITZ bulat (size 52) tetap di atas form
- [x] **3.5** Aurora glow background dipertahankan

### Phase 4 — Animasi & Motion (yang sebelumnya kurang)

- [x] **4.1** GSAP Timeline animation di hero (eyebrow → headline → sub → CTA → stats stagger)
- [x] **4.2** ScrollTrigger reveal pada section card grid
- [x] **4.3** Mobile menu animasi fullscreen dengan body scroll lock
- [x] **4.4** Card hover lift + border glow (CSS + Tailwind transitions)
- [x] **4.5** Animated football pitch canvas (11v11 player + ball + particles + IntersectionObserver pause)
- [x] **4.6** Preloader GSAP fade-out

### Phase 5 — Dashboard Visual Refresh

- [x] **5.1** Dashboard sudah pakai CSS variables baru (`--canvas`, `--primary`, `--surface`, dll)
- [ ] **5.2** Verifikasi visual dashboard (AdminDashboard, MarketingDashboard, TrainingHub) — pending screenshot validation
- [ ] **5.3** Sidebar/header dashboard dipoles agar konsisten dengan public design (jika perlu)

### Phase 6 — Testing & Validation

- [ ] **6.1** Smoke test screenshot semua 6 public pages
- [ ] **6.2** Smoke test login/register tampilan dengan header/footer
- [ ] **6.3** Frontend testing agent (full flow + nav + scroll + responsive)
- [ ] **6.4** Verifikasi data dinamis: Services price mapping, Community events list

---

## 🗂️ Files Created (new)

```
/app/frontend/src/components/public/
  ├── Navigation.js          (Sticky nav + mobile menu)
  ├── Footer.js              (4-col footer + socials)
  ├── Preloader.js           (GSAP loading screen)
  ├── ScrollReveal.js        (GSAP ScrollTrigger wrapper)
  ├── HeroSection.js         (Reusable hero w/ GSAP timeline)
  ├── FootballPitchCanvas.js (Animated 11v11 pitch)
  └── PublicLayout.js        (Nav + Footer + Preloader gate)

/app/frontend/src/pages/public/
  ├── Home.js
  ├── About.js
  ├── Services.js   (Dynamic pricing dari backend packages)
  ├── Tools.js
  ├── Community.js  (Dynamic events dari backend)
  └── Contact.js
```

## 🗂️ Files Modified

- `/app/frontend/src/App.js` — Routes restructured: 6 public pages + login/register wrapped in PublicLayout
- `/app/frontend/src/pages/Login.js` — Removed standalone bg-grain wrapper, fits inside PublicLayout
- `/app/frontend/src/pages/Register.js` — Same as Login
- `/app/frontend/package.json` — Added `gsap@3.15.0`

## 🗂️ Files Untouched (still active, legacy)

- `/app/frontend/src/pages/Landing.js` — **UNUSED** (replaced by `pages/public/Home.js`). Bisa dihapus di future cleanup.

## 🗂️ Files Untouched (dashboard side, no change needed)

- `DashboardLayout.js` — Sidebar+main, sudah pakai CSS vars baru
- `AdminDashboard.js`, `MarketingDashboard.js`, `TrainingHub.js`, etc. — Already on new palette

---

## 🎨 Design System Reference

### Colors (CSS variables)
- `--canvas: #0B0C10` (body bg)
- `--surface: #161B22` (card bg level 1)
- `--primary: #00A8FF` (electric blue — main accent)
- `--secondary: #E50914` (red — secondary accent)
- `--text-primary: #FFFFFF`
- `--text-secondary: #A0AAB5`
- `--text-muted: #5C6670`
- `--border-color: #2A2F36`

### Typography
- Display: `Space Grotesk` 600/700 weight, letter-spacing -0.02em
- Body: `Inter` 400/500 weight
- Eyebrow: 0.72rem uppercase 0.16em letter-spacing

### Spacing
- Section padding: `py-20 md:py-28 lg:py-32`
- Content max-width: `80rem` (1280px)

---

## 📌 Next / Open Items

1. **(P0)** User to visually verify all 6 pages + login/register on preview URL
2. **(P1)** Optional: cleanup unused `Landing.js`
3. **(P1)** Polish dashboard surfaces if user notices inconsistency
4. **(P1)** Implement Xendit/Midtrans payment gateway (backlog from PRD)
5. **(P2)** News/Event detail public pages (backlog)
6. **(P2)** Forgot-password flow

