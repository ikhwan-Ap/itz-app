# ITZ-App — Development Review & Roadmap

> **Tanggal:** 2026-05-27  
> **Domain:** https://indotimezone.store  
> **Stack:** FastAPI + MongoDB + React 19 + Tailwind + Nginx + systemd  
> **Branch aktif:** main  
> **Repo:** Private (GitHub)

---

## 1. Status Server & Security (Post-Hardening)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Firewall (UFW) | OK | 22/80/443 only |
| SSH | OK | Key-only, root disabled, user `itzadmin` + sudo |
| Fail2ban | OK | SSH jail aktif, 3 retry = ban 24 jam |
| SSL/HTTPS | OK | Let's Encrypt + Cloudflare proxy |
| MongoDB | OK | Bind 127.0.0.1 |
| Backend | OK | Bind 127.0.0.1, proxied via Nginx |
| Rate limiting | OK | Nginx: 20 req/s general, 5 req/min auth |
| Security patches | OK | apt upgrade applied 2026-05-27 |
| .git exposure | OK | Blocked via Nginx |

---

## 2. Fitur yang Sudah Implementasi (di branch main)

| Fitur | Status | Catatan |
|-------|--------|---------|
| Auth (register/login/logout/refresh) | Done | Cookie-based JWT, brute-force protection |
| Admin CRUD users | Done | Role-based (user/marketing/admin/superadmin) |
| Package management | Done | Trial + paid packages |
| Promo codes | Done | Percent/flat discount, marketing attribution |
| Transaction approval | Done | Manual payment flow |
| Calculator (Full/Single/GK) | Done | Multi-priority sniper algorithm |
| Training History (simpan sesi) | Done | CRUD + note + detail modal |
| Unified Dashboard | Done | Admin/marketing/user sections |
| Role-based permissions | Done | `permissions.js` frontend gate |
| News & Events | Done | CRUD + event registration |
| Audit log | Done | Admin actions tracked |
| Streak tracking | Done | Daily training streak |
| Forgot/Reset password | Done | In main branch |
| Responsive table | Done | Paginated, sortable |

---

## 3. Bug & Technical Debt yang Ditemukan

### BUG-01: Duplicate Training Results Endpoints (CRITICAL)

**File:** `backend/server.py` lines 1230-1316 dan 1455-1530

Endpoint `/api/training-results` (POST, GET, GET/:id, PATCH, DELETE) didefinisikan **DUA KALI** di file yang sama. FastAPI akan register keduanya, yang terakhir menang. Versi pertama (line 1230) lebih lengkap (ada `user_email`, `is_public`, `share_slug`, `shared_count`, admin override). Versi kedua (line 1455) lebih sederhana.

**Fix:** Hapus blok duplikat kedua (line 1455-1530), pertahankan yang pertama.

### BUG-02: Old Build File Masih Ada

`frontend/build/static/js/main.9b919fea.js` (old) masih ada di samping `main.75c8d054.js` (current). Tidak breaking tapi menambah ukuran deploy.

**Fix:** Hapus old build files sebelum commit build baru.

### BUG-03: Backend Belum Restart Setelah Checkout Main

Server backend masih running dari code lama (sebelum checkout ke main). Training history endpoints belum aktif di production.

**Fix:** `sudo systemctl restart itz-backend`

### DEBT-01: Git Branch Mismatch (Resolved)

Server sebelumnya di branch `master` tanpa upstream tracking. Sudah di-checkout ke `main` (sesuai origin).

### DEBT-02: Untracked Files di Server

- `backend/.python-version`
- `frontend/build_new/` (temp)
- `package-lock.json` (root level, empty)

**Fix:** Tambahkan ke `.gitignore` atau hapus.

---

## 4. Fitur "Simpan Sesi Latihan" — Analisis

### Status: SUDAH DIIMPLEMENTASI

Backend endpoints:
- `POST /api/training-results` — simpan hasil kalkulasi
- `GET /api/training-results` — list history (paginated, filter by mode)
- `GET /api/training-results/:id` — detail lengkap (termasuk step history)
- `PATCH /api/training-results/:id/note` — tambah/edit catatan
- `DELETE /api/training-results/:id` — hapus

Frontend:
- `TrainingHistory.js` — halaman riwayat dengan tabel, filter mode, detail modal
- `FullLatihan.js`, `GKLatihan.js`, `SingleDrill.js` — sudah ada tombol simpan setelah run

Data yang disimpan per sesi:
- Mode (full/single/gk)
- Posisi & roles
- Input stats (sebelum latihan)
- Final stats (setelah latihan)
- Targets & priorities
- Step-by-step drill history
- Overall rating
- Total cost (jam latihan)
- User note
- Timestamp

### Yang Belum Ada (Enhancement):

1. **Compare sessions** — bandingkan 2 sesi side-by-side
2. **Progress chart** — grafik perkembangan overall rating over time
3. **Export PDF/image** — share hasil latihan
4. **Public sharing** — field `is_public` dan `share_slug` sudah ada di schema tapi belum ada endpoint/UI
5. **Favorite/pin** — tandai sesi penting

---

## 5. Rekomendasi Pengembangan Selanjutnya

### Priority 1 — Fix & Stabilize (Harus Segera)

| # | Task | Effort |
|---|------|--------|
| 1 | Fix duplicate endpoints di server.py | 15 min |
| 2 | Restart backend di production | 1 min |
| 3 | Clean old build files | 5 min |
| 4 | Verify training history works end-to-end | 10 min |

### Priority 2 — Product Value (Next Sprint)

| # | Task | Deskripsi | Effort |
|---|------|-----------|--------|
| 1 | User Progress Dashboard | Chart overall rating over time, streak stats | 1-2 hari |
| 2 | Session Compare | Side-by-side comparison 2 sesi | 1 hari |
| 3 | Share Result (public link) | Gunakan `share_slug` yang sudah ada | 0.5 hari |
| 4 | Export to Image/PDF | Screenshot-friendly view atau generate PDF | 1 hari |
| 5 | Push Notification | Reminder latihan harian (streak) | 1 hari |

### Priority 3 — Growth & Monetization

| # | Task | Deskripsi | Effort |
|---|------|-----------|--------|
| 1 | Payment Gateway (Xendit/Midtrans) | Auto-approve setelah bayar | 2-3 hari |
| 2 | Referral system | User invite user, dapat bonus | 1-2 hari |
| 3 | Marketing dashboard analytics | Conversion rate, revenue per promo | 1-2 hari |
| 4 | Email notifications | Welcome, expiry warning, receipt | 1 hari |
| 5 | Mobile PWA optimization | Offline support, install prompt | 1-2 hari |

### Priority 4 — Advanced Features

| # | Task | Deskripsi | Effort |
|---|------|-----------|--------|
| 1 | Team/Club management | Grup pemain, shared training plan | 3-5 hari |
| 2 | AI recommendation | Suggest drill berdasarkan history | 2-3 hari |
| 3 | Multi-language (EN/ID) | i18n support | 2 hari |
| 4 | Admin analytics dashboard | User growth, revenue, churn | 2 hari |
| 5 | API rate limiting per user tier | Trial vs paid limits | 1 hari |

---

## 6. Deployment Checklist (Setiap Deploy)

```bash
# Lokal
npm run build                    # di frontend/
git add -A && git commit -m "..."
git push origin main

# Server
cd /var/www/itz-app
sudo git pull origin main
sudo systemctl restart itz-backend
# Nginx reload hanya jika config berubah
```

---

## 7. Catatan Arsitektur

- Frontend build di-commit ke repo (policy: no build di server)
- MongoDB tidak pakai auth (bind localhost only — acceptable untuk single-server)
- JWT via httpOnly cookie (SameSite=None, Secure) — requires HTTPS
- Cloudflare proxy aktif — origin cert via Let's Encrypt
- Auto-renewal certbot via systemd timer
- Backup MongoDB: `backup_mongo.sh` (cron)

---

## 8. Kontak & Akses

- SSH: `ssh itzadmin@<server-ip>` (key-based only)
- Root login: DISABLED
- Cloudflare: manage via dashboard
- GitHub: private repo `ikhwan-Ap/itz-app`
