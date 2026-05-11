# ITZ-App — Update Execution Specification

> Project: Indo Timezone Tactical Edge  
> Domain: https://indotimezone.store  
> Stack: FastAPI + MongoDB + React + Tailwind + Nginx + Uvicorn + systemd  
> Purpose: Menyelesaikan masalah yang terdeteksi dari system_map.md terlebih dahulu, lalu melanjutkan roadmap pengembangan produk.

---

# 0. Prinsip Eksekusi Agent

AI Agent wajib mengikuti urutan ini:

1. Jangan langsung mengerjakan fitur baru.
2. Selesaikan dulu issue existing dari system_map.md.
3. Jangan menghapus `.git` di server.
4. `.git` tetap dipakai untuk deploy via `git pull origin main`.
5. Akses publik ke `.git` harus tetap diblok via Nginx.
6. Jangan build frontend di server jika policy deploy adalah build lokal lalu commit `frontend/build`.
7. Jangan menaikkan Uvicorn workers di VPS kecil.
8. Backend production harus bind ke `127.0.0.1:8000`, bukan `0.0.0.0:8000`.
9. Semua perubahan wajib dicatat di `update-execution-tracker.md`.
10. Setelah setiap task selesai, lakukan verifikasi manual/otomatis.

---

# 1. Current System Baseline

## 1.1 Arsitektur Saat Ini

Internet
→ Cloudflare
→ Nginx port 80/443
→ React SPA dari `/var/www/itz-app/frontend/build`
→ `/api/` proxy ke `http://127.0.0.1:8000`
→ Uvicorn FastAPI backend
→ MongoDB localhost

## 1.2 Stack

- Backend: FastAPI
- Database: MongoDB
- Frontend: React 19
- Styling: Tailwind CSS
- Animation: GSAP, Framer Motion
- Server: Ubuntu 24.04 VPS
- Proxy: Nginx
- Process Manager: systemd
- Deployment: manual git pull

## 1.3 Production Policy

Deployment production menggunakan:

- Build frontend dilakukan di lokal.
- Folder `frontend/build` ikut di-commit.
- Server hanya melakukan `git pull origin main`.
- Server restart backend via systemd.
- Server reload Nginx jika config berubah.
- Tidak menjalankan `npm run build` di server.
- Tidak menghapus `.git` dari server.
- `.git` wajib diblok dari public access via Nginx.

---

# 2. Masalah Existing dari system_map.md yang Harus Diselesaikan Dulu

## 2.1 Issue A — system_map.md outdated

### Masalah

Beberapa isi `system_map.md` sudah tidak sesuai kondisi terbaru.

Contoh data lama:

- Uvicorn tertulis 2 workers.
- Server `.env` tertulis permission 644.
- Deployment tertulis build di production.
- HTTPS tertulis belum ada.
- `.git` tertulis tidak perlu di server.
- Sensitive files tertulis masih ada di server.
- Root `venv` duplikat tertulis masih ada.
- Backend sebelumnya bind ke `0.0.0.0`.

### Kondisi terbaru yang benar

- Uvicorn production harus `workers 1`.
- Backend bind ke `127.0.0.1:8000`.
- `.env` permission harus `600`.
- `.git` tetap ada di server untuk deploy via `git pull`.
- Public access ke `/.git/*` sudah harus 404.
- HTTPS public aktif via Cloudflare.
- Sensitive AI agent files harus sudah dibersihkan dari server.
- Root duplicate `venv` harus sudah dihapus.
- UFW harus allow 22/80/443 dan deny 8000.

### Task

Update `system_map.md` supaya mencerminkan kondisi terbaru.

### Acceptance Criteria

- `system_map.md` tidak lagi menyebut Uvicorn 2 workers untuk production.
- `system_map.md` tidak lagi menyebut `.env` 644.
- `system_map.md` menjelaskan bahwa `.git` tetap ada untuk deployment.
- `system_map.md` menjelaskan bahwa `.git` diblok via Nginx.
- `system_map.md` menjelaskan deploy policy: build lokal, commit build, server git pull.
- `system_map.md` menjelaskan backend bind ke `127.0.0.1`.
- `system_map.md` menjelaskan swap/resource issue yang pernah terjadi.
- `system_map.md` menjelaskan bahwa VPS kecil tidak boleh memakai workers 2.

---

## 2.2 Issue B — GK Latihan belum masuk navigasi

### Masalah

Route `/app/training/gk` sudah ada, tetapi di system map disebut belum masuk `DashboardLayout` nav item dan belum masuk `CommandPalette`.

### Dampak

User bisa saja tidak menemukan fitur GK Latihan walaupun routenya tersedia.

### Task

Tambahkan GK Latihan ke:

- Dashboard sidebar navigation
- Mobile drawer navigation
- CommandPalette
- TrainingHub card/list jika belum ada

### Acceptance Criteria

- User bisa membuka GK Latihan dari sidebar.
- User bisa membuka GK Latihan dari command palette.
- User bisa membuka GK Latihan dari TrainingHub.
- Route `/app/training/gk` tetap protected untuk user, admin, superadmin.
- Tidak ada broken route.

---

## 2.3 Issue C — Landing.js unused

### Masalah

`frontend/src/pages/Landing.js` disebut unused dan sudah digantikan oleh `pages/public/Home.js`.

### Risiko

Kode mati membuat agent bingung, build membesar, dan maintenance tidak jelas.

### Task

Audit apakah `Landing.js` benar-benar tidak dipakai.

### Acceptance Criteria

Jika benar tidak dipakai:

- Hapus file `Landing.js`.
- Pastikan tidak ada import menuju `Landing.js`.
- Pastikan route `/` tetap menggunakan `pages/public/Home.js`.
- Pastikan build tidak error.

Jika masih dipakai:

- Update system_map.md agar tidak menyebut unused.

---

## 2.4 Issue D — .env.example tidak lengkap

### Masalah

`backend/.env.example` hanya punya sebagian key, belum mencakup semua environment production.

### Required Keys

Backend `.env.example` harus mencakup:

- APP_ENV
- MONGO_URL
- DB_NAME
- JWT_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD
- FRONTEND_URL
- CORS_ORIGINS

Frontend `.env.example` harus mencakup:

- REACT_APP_BACKEND_URL
- SKIP_PREFLIGHT_CHECK

### Acceptance Criteria

- `.env.example` lengkap.
- Tidak ada secret asli di `.env.example`.
- Semua secret menggunakan placeholder.
- `system_map.md` update bagian environment variables.

---

## 2.5 Issue E — Dependencies bloat

### Masalah

System map menyebut beberapa dependencies backend kemungkinan tidak dipakai production:

- boto3
- pandas
- numpy
- emergentintegrations

Frontend juga memiliki dependency dev/platform-specific:

- @emergentbase/visual-edits

### Risiko

- Install lebih berat.
- Memory footprint lebih besar.
- VPS kecil lebih rentan OOM.
- Attack surface lebih besar.

### Task

Audit dependencies yang benar-benar dipakai.

### Acceptance Criteria

- Dependency tidak dipakai dihapus dari requirements/package jika aman.
- Jika masih dipakai untuk dev-only, pisahkan dokumentasinya.
- Production requirements harus minimal.
- Build dan test tetap jalan.

---

## 2.6 Issue F — Production resource policy

### Masalah

Server pernah mengalami OOM karena Uvicorn workers 2 pada VPS kecil.

### Policy Baru

Production VPS kecil wajib memakai:

- Uvicorn workers 1
- Host `127.0.0.1`
- Port `8000`
- `--limit-max-requests` untuk mitigasi memory leak
- Swap aktif minimal 1GB
- Nginx proxy ke `127.0.0.1:8000`
- UFW deny direct access ke port 8000

### Acceptance Criteria

- `systemd` service memakai workers 1.
- `ss -tlnp` menunjukkan `127.0.0.1:8000`.
- `free -h` menunjukkan swap aktif.
- Public API normal.
- Tidak ada Cloudflare 502 setelah idle/traffic ringan.

---

## 2.7 Issue G — Nginx hardening

### Required Protection

Nginx harus memblok:

- `/.git/*`
- `/.env`
- hidden files selain `.well-known`
- file backup sensitif seperti `.bak`, `.old`, `.sql`, `.log`

### Acceptance Criteria

Request berikut harus menghasilkan 404 atau 403:

- `https://indotimezone.store/.git/config`
- `https://indotimezone.store/.git/HEAD`
- `https://indotimezone.store/.env`
- `https://indotimezone.store/backend/.env`

Request berikut tetap boleh:

- `https://indotimezone.store/`
- `https://indotimezone.store/.well-known/`

---

## 2.8 Issue H — Backup MongoDB belum ada

### Masalah

Belum ada backup database rutin.

### Data Penting

Collections yang wajib masuk backup:

- users
- packages
- promos
- transactions
- news
- events
- event_registrations
- payment_config
- notifications
- login_attempts

### Task

Siapkan strategi backup MongoDB.

### Acceptance Criteria

- Ada script backup MongoDB.
- Ada lokasi backup.
- Ada retention policy.
- Ada log backup.
- Ada instruksi restore.
- Ada catatan di system_map.md.

---

## 2.9 Issue I — Pagination belum konsisten

### Masalah

Endpoint list berpotensi mengambil banyak data tanpa pagination.

Endpoint prioritas:

- users
- transactions
- promos
- news
- events
- event_registrations
- notifications
- audit_logs nanti

### Task

Buat standard pagination response.

### Standard Query

- page
- limit
- search
- status
- sort

### Standard Response

- items
- meta.page
- meta.limit
- meta.total
- meta.pages
- meta.has_next
- meta.has_prev

### Acceptance Criteria

- Endpoint list utama support pagination.
- Frontend table support pagination.
- Default limit 20.
- Maximum limit 100.
- Tidak ada endpoint admin yang load semua data tanpa limit.

---

## 2.10 Issue J — Rate limiting belum cukup

### Endpoint Sensitif

- auth login
- auth register
- forgot password nanti
- promo validate
- calculator run

### Task

Tambahkan rate limiting di Nginx dan/atau backend.

### Acceptance Criteria

- Login tidak bisa di-spam.
- Register tidak bisa di-spam.
- Promo validate tidak bisa di-bruteforce.
- Calculator run tidak bisa di-spam.
- Response rate limit jelas.
- Tidak mengganggu user normal.

---

# 3. ERD Lengkap Target

## 3.1 Core Users & Auth

### users

Fields:

- id
- email
- password_hash
- password2_hash
- role
- status
- package_id
- expires_at
- clicks_used
- max_clicks
- current_streak
- longest_streak
- last_training_date
- display_name
- avatar_url
- leaderboard_opt_in
- referral_code
- referred_by_user_id
- created_at
- updated_at

Relations:

- users.package_id → packages.id
- users.referred_by_user_id → users.id
- users.id → transactions.user_id
- users.id → training_results.user_id
- users.id → notifications.user_id
- users.id → audit_logs.actor_user_id

---

### login_attempts

Fields:

- id
- identifier
- email
- ip_address
- attempts
- locked_until
- created_at
- updated_at

Purpose:

- Brute-force protection.

---

### password_reset_tokens

Fields:

- id
- user_id
- email
- token_hash
- expires_at
- used
- created_at
- used_at
- ip_address

Relations:

- password_reset_tokens.user_id → users.id

---

## 3.2 Packages, Payment, Transactions

### packages

Fields:

- id
- name
- description
- price
- duration_type
- duration_value
- max_clicks
- is_trial
- active
- features
- created_at
- updated_at

Relations:

- packages.id → users.package_id
- packages.id → transactions.package_id
- packages.id → training_plans.package_id optional

---

### promos

Fields:

- id
- code
- discount_type
- discount_value
- max_uses
- uses
- valid_until
- owner_marketing_id
- active
- created_at
- updated_at

Relations:

- promos.owner_marketing_id → users.id
- promos.code → transactions.promo_code
- promos.id → promo_usages.promo_id

---

### promo_usages

Fields:

- id
- promo_id
- promo_code
- user_id
- transaction_id
- package_id
- marketing_id
- discount_amount
- final_amount
- created_at

Relations:

- promo_usages.promo_id → promos.id
- promo_usages.user_id → users.id
- promo_usages.transaction_id → transactions.id
- promo_usages.package_id → packages.id
- promo_usages.marketing_id → users.id

---

### transactions

Fields:

- id
- invoice_number
- user_id
- package_id
- previous_package_id
- transaction_type
- amount
- discount_amount
- final_amount
- marketing_id
- marketing_cut
- promo_code
- payment_method
- payment_instructions
- proof_image_url
- status
- rejection_reason
- approved_by
- rejected_by
- expired_at
- paid_at
- approved_at
- rejected_at
- created_at
- updated_at

Status:

- pending_payment
- waiting_approval
- approved
- rejected
- expired
- cancelled

Relations:

- transactions.user_id → users.id
- transactions.package_id → packages.id
- transactions.previous_package_id → packages.id
- transactions.marketing_id → users.id
- transactions.approved_by → users.id
- transactions.rejected_by → users.id

---

### payment_config

Fields:

- id
- manual_enabled
- bank_info
- qris_info
- xendit_enabled
- xendit_config
- midtrans_enabled
- midtrans_config
- updated_by
- updated_at

Relations:

- payment_config.updated_by → users.id

---

### marketing_payouts

Fields:

- id
- marketing_id
- period_start
- period_end
- total_transactions
- gross_revenue
- total_commission
- status
- paid_at
- created_by
- created_at
- updated_at

Relations:

- marketing_payouts.marketing_id → users.id
- marketing_payouts.created_by → users.id

---

## 3.3 Training System

### training_results

Fields:

- id
- user_id
- mode
- position
- roles
- input_stats
- targets
- grey_limit
- white_multiplier
- drill_filter
- final_stats
- overall
- total_cost
- history
- white_set
- note
- share_slug
- is_public
- shared_count
- created_at
- updated_at

Relations:

- training_results.user_id → users.id

---

### training_presets

Fields:

- id
- name
- slug
- position
- category
- description
- target_attrs
- default_goals
- priorities
- recommended_grey_limit
- recommended_multiplier
- recommended_mode
- is_gk
- active
- created_by
- created_at
- updated_at

Relations:

- training_presets.created_by → users.id

---

### training_plans

Fields:

- id
- user_id
- title
- position
- mode
- duration_days
- goal
- input_snapshot
- plan_days
- status
- completed_days
- created_at
- completed_at
- updated_at

Status:

- active
- completed
- cancelled
- archived

Relations:

- training_plans.user_id → users.id

---

## 3.4 CMS, Events, Community

### news

Fields:

- id
- title
- slug
- content
- image_url
- published
- author_id
- author_name
- created_at
- updated_at

Relations:

- news.author_id → users.id

---

### events

Fields:

- id
- title
- slug
- content
- image_url
- event_date
- registration_required
- published
- author_id
- reward_enabled
- reward_type
- reward_value
- reward_description
- created_at
- updated_at

Relations:

- events.author_id → users.id

---

### event_registrations

Fields:

- id
- event_id
- user_id
- status
- note
- approved_by
- rejected_by
- rejection_reason
- created_at
- approved_at
- rejected_at

Relations:

- event_registrations.event_id → events.id
- event_registrations.user_id → users.id
- event_registrations.approved_by → users.id
- event_registrations.rejected_by → users.id

---

### user_rewards

Fields:

- id
- user_id
- event_id
- reward_type
- reward_value
- status
- claimed_at
- created_at

Relations:

- user_rewards.user_id → users.id
- user_rewards.event_id → events.id

---

### certificates

Fields:

- id
- user_id
- event_id
- certificate_number
- title
- recipient_name
- issued_at
- verification_code
- pdf_url
- created_at

Relations:

- certificates.user_id → users.id
- certificates.event_id → events.id

---

### badges

Fields:

- id
- name
- slug
- description
- icon
- rule_type
- active
- created_at

---

### user_badges

Fields:

- id
- user_id
- badge_id
- earned_at

Relations:

- user_badges.user_id → users.id
- user_badges.badge_id → badges.id

---

## 3.5 Notifications, Audit, Ops

### notifications

Fields:

- id
- user_id
- type
- title
- body
- link
- read
- created_at

Relations:

- notifications.user_id → users.id

---

### audit_logs

Fields:

- id
- actor_user_id
- actor_email
- actor_role
- action
- target_type
- target_id
- ip_address
- user_agent
- metadata
- before
- after
- created_at

Relations:

- audit_logs.actor_user_id → users.id

---

### backup_logs

Fields:

- id
- status
- file_path
- file_size
- backup_type
- started_at
- finished_at
- error_message

---

### referrals

Fields:

- id
- referrer_user_id
- referred_user_id
- referral_code
- status
- reward_status
- transaction_id
- created_at
- rewarded_at

Relations:

- referrals.referrer_user_id → users.id
- referrals.referred_user_id → users.id
- referrals.transaction_id → transactions.id

---

# 4. ERD Relationship Summary

## User Relationships

users has many:

- transactions
- notifications
- training_results
- training_plans
- event_registrations
- user_rewards
- certificates
- user_badges
- audit_logs as actor
- referrals as referrer
- referrals as referred

users belongs to:

- packages via package_id
- users via referred_by_user_id

---

## Package Relationships

packages has many:

- users
- transactions
- promo_usages

---

## Promo Relationships

promos belongs to:

- marketing user via owner_marketing_id

promos has many:

- promo_usages
- transactions via promo_code

---

## Transaction Relationships

transactions belongs to:

- users
- packages
- marketing user
- approver user
- rejector user

transactions has one/many:

- promo_usage
- referral reward trigger

---

## Training Relationships

training_results belongs to:

- users

training_plans belongs to:

- users

training_presets optionally belongs to:

- creator admin

---

## Event Relationships

events has many:

- event_registrations
- user_rewards
- certificates

event_registrations belongs to:

- events
- users
- approving admin

---

## Security/Ops Relationships

audit_logs belongs to:

- actor user

notifications belongs to:

- user

backup_logs standalone ops collection

---

# 5. Alur Sistem Lengkap

## 5.1 Public Visitor Flow

Visitor membuka website.

Flow:

1. User membuka `/`.
2. Nginx serve React SPA.
3. React menampilkan PublicLayout.
4. User bisa membuka:
   - Home
   - About
   - Services
   - Tools
   - Community
   - Contact
   - Login
   - Register
5. Services mengambil data paket dari `/api/packages`.
6. Community mengambil events dari `/api/events`.
7. User memilih register atau login.

---

## 5.2 Register Flow

1. User membuka `/register`.
2. User mengisi email, password, password2, package, promo optional.
3. Frontend call `/api/auth/register`.
4. Backend validasi:
   - email valid
   - email belum terdaftar
   - password minimal valid
   - password2 valid
   - package valid
   - promo valid jika ada
5. Backend create user status `pending`.
6. Backend create transaction jika package berbayar.
7. Backend create notification untuk admin/superadmin.
8. User diarahkan ke halaman status pending/payment.
9. Admin approve transaksi atau user.
10. User menjadi active.
11. User bisa login dan mengakses training.

---

## 5.3 Login Flow

1. User membuka `/login`.
2. User submit email/password.
3. Backend cek brute-force login_attempts.
4. Backend verify bcrypt password.
5. Backend cek status user.
6. Backend cek expiry package.
7. Backend issue access token dan refresh token via httpOnly cookie.
8. Frontend call `/api/auth/me`.
9. User diarahkan sesuai role:
   - user → `/app`
   - admin/superadmin → `/app/admin`
   - marketing → `/app/marketing`

---

## 5.4 Auth Refresh Flow

1. Access token expired.
2. Frontend mendapat unauthorized.
3. Frontend call `/api/auth/refresh`.
4. Backend baca refresh cookie.
5. Backend issue access token baru.
6. Frontend retry request.
7. Jika refresh gagal, logout user.

---

## 5.5 User Training Flow

1. User masuk dashboard.
2. User pilih:
   - Full Latihan
   - Single Drill
   - GK Latihan
   - Preset
   - Training Plan
3. User input atribut dan target.
4. Frontend call `/api/calculator/run`.
5. Backend validasi:
   - user active
   - package belum expired
   - click limit masih ada
6. Backend run calculator engine.
7. Backend update streak.
8. Backend update clicks_used.
9. Backend return result.
10. User melihat result.
11. User bisa:
   - save result
   - share result
   - generate training plan
   - duplicate simulation
   - compare result

---

## 5.6 Save Training Result Flow

1. User selesai menjalankan calculator.
2. User klik Save Result.
3. Frontend submit result ke `/api/training-results`.
4. Backend simpan:
   - input stats
   - target
   - final stats
   - history
   - overall
   - total cost
5. Dashboard progress otomatis ikut berubah.
6. History latihan menampilkan result terbaru.

---

## 5.7 Training Plan Flow

1. User pilih Generate Plan.
2. User pilih:
   - posisi
   - target
   - durasi
   - mode hemat/balance/fast
3. Backend menjalankan simulasi atau memakai hasil terakhir.
4. Backend membagi hasil menjadi day-by-day plan.
5. User melihat checklist plan.
6. User bisa mark day completed.
7. Setelah semua selesai, plan status menjadi completed.
8. User bisa generate certificate/badge achievement jika rule tersedia.

---

## 5.8 Manual Payment Flow

1. User pilih paket.
2. User masuk checkout.
3. Backend create transaction status `pending_payment`.
4. Backend generate invoice number.
5. User melihat instruksi pembayaran.
6. User upload bukti transfer.
7. Transaction status berubah menjadi `waiting_approval`.
8. Admin melihat pending transaction.
9. Admin approve/reject.
10. Jika approve:
    - user package aktif
    - expires_at update
    - max_clicks update
    - notification dikirim ke user
    - promo usage dicatat jika ada
    - marketing commission dihitung jika ada
11. Jika reject:
    - rejection reason tersimpan
    - notification dikirim ke user

---

## 5.9 Promo & Marketing Flow

1. Marketing membuat promo code.
2. User menggunakan promo saat checkout.
3. Backend validate promo.
4. Jika valid:
   - discount applied
   - transaction menyimpan promo_code
   - transaction menyimpan marketing_id
   - promo_usage dibuat
5. Jika transaksi approved:
   - marketing_cut dihitung
   - marketing dashboard update
6. Admin bisa generate payout report.

---

## 5.10 Event Flow

1. Admin membuat event.
2. Event muncul di public community page.
3. User daftar event.
4. event_registration dibuat status pending.
5. Admin approve/reject.
6. Jika approve:
   - user dapat notification
   - jika reward aktif, user_rewards dibuat
7. Setelah event selesai:
   - admin grant reward
   - admin generate certificate/badge jika perlu

---

## 5.11 Notification Flow

Notification dibuat saat:

- transaksi baru
- transaksi approved
- transaksi rejected
- event registration approved
- reward granted
- certificate issued
- password changed
- package expiring soon

Frontend:

- fetch notifications dengan pagination
- mark read
- mark all read

---

## 5.12 Audit Log Flow

Audit log dibuat saat:

- login gagal berulang
- admin approve transaction
- admin reject transaction
- admin update user
- superadmin delete user
- admin update package
- admin update promo
- superadmin update payment config
- admin grant reward
- admin generate certificate

Audit log hanya bisa dilihat superadmin.

---

# 6. Roadmap Setelah Issue Existing Selesai

## Phase 1 — Stabil & Trust

### 6.1 Health Check

Priority: Critical

Deliverables:

- `/api/health`
- `/api/health/db`
- health script server
- health section di system_map.md

---

### 6.2 MongoDB Backup

Priority: Critical

Deliverables:

- backup script
- backup folder
- backup retention
- restore instruction
- backup log

---

### 6.3 Forgot Password

Priority: High

Deliverables:

- password_reset_tokens collection
- forgot password endpoint
- reset password endpoint
- forgot password page
- reset password page
- admin reset fallback

---

### 6.4 Pagination

Priority: High

Deliverables:

- standard pagination helper
- users pagination
- transactions pagination
- notifications pagination
- promos pagination
- events/news pagination
- ResponsiveTable pagination

---

### 6.5 Audit Log

Priority: High

Deliverables:

- audit_logs collection
- audit helper
- audit log on admin actions
- audit logs admin page
- superadmin access only

---

### 6.6 Rate Limit

Priority: High

Deliverables:

- Nginx rate limit for login/register
- backend rate limit for sensitive endpoints
- promo validation rate limit
- calculator run rate limit

---

## Phase 2 — Product Value

### 6.7 Save Result

Priority: Very High

Deliverables:

- training_results collection
- save result button
- result note
- result detail page

---

### 6.8 History Latihan

Priority: Very High

Deliverables:

- `/app/training/history`
- list result
- detail result
- duplicate simulation
- delete result
- compare result optional

---

### 6.9 Dashboard Progress

Priority: High

Deliverables:

- user progress API
- overall chart
- streak calendar
- radar attribute
- last training card
- recommended next training

---

### 6.10 Preset Posisi

Priority: High

Deliverables:

- preset data
- preset API
- preset selector in Full Latihan
- preset selector in Single Drill
- preset selector in GK Latihan
- admin manage preset optional

---

### 6.11 Training Plan Generator

Priority: Medium-High

Deliverables:

- training_plans collection
- generate plan API
- plan list page
- plan detail page
- complete day action

---

## Phase 3 — Monetisasi

### 6.12 Invoice Manual

Priority: High

Deliverables:

- invoice number
- checkout page
- transaction status improvement
- payment instruction page

---

### 6.13 Upload Bukti Transfer

Priority: High

Deliverables:

- upload proof
- validate file type/size
- admin preview proof
- approve/reject with reason

---

### 6.14 Package Upgrade/Downgrade

Priority: Medium

Deliverables:

- transaction_type
- renewal flow
- upgrade flow
- user package card

---

### 6.15 Promo Tracking

Priority: Medium-High

Deliverables:

- promo_usages collection
- promo performance API
- promo usage detail
- marketing dashboard improvement

---

### 6.16 Marketing Commission Report

Priority: Medium

Deliverables:

- commission report API
- marketing commission page
- admin payout page
- payout status

---

## Phase 4 — Growth

### 6.17 Share Result

Priority: Medium

Deliverables:

- public share slug
- share result page
- copy summary
- WhatsApp share
- image share optional

---

### 6.18 Leaderboard

Priority: Medium-Low

Deliverables:

- leaderboard opt-in
- display name
- leaderboard API
- leaderboard page
- privacy protection

---

### 6.19 Community Event Reward

Priority: Medium

Deliverables:

- reward fields in events
- user_rewards collection
- reward claim flow
- reward notification

---

### 6.20 Certificate/Event Badge

Priority: Medium-Low

Deliverables:

- certificates collection
- verify certificate page
- badges collection
- user_badges collection
- event badge flow

---

### 6.21 Referral System

Priority: Low-Medium

Deliverables:

- referral_code in users
- referrals collection
- register with referral
- referral dashboard card
- reward after activation/payment

---

# 7. Execution Rules for AI Agent

## Before Starting

Agent must:

1. Read `system_map.md`.
2. Read current project files.
3. Compare actual code with this update spec.
4. Do not assume old system_map is accurate.
5. Prefer actual code/server state when conflict exists.
6. Update docs after each completed task.

## Per Task Required Output

For every task, agent must record:

- What file changed
- Why it changed
- What behavior changed
- How to verify
- Whether tests/build passed
- Risk level
- Rollback instruction

## Verification Required

After backend changes:

- test health endpoint
- test login
- test auth/me
- test calculator/meta
- test calculator/run if auth available

After frontend changes:

- run build locally
- verify routes
- verify protected route
- verify nav item

After Nginx/server changes:

- nginx config test
- reload nginx
- curl public endpoint
- curl blocked sensitive path

---

# 8. Definition of Done

A phase is done only if:

1. All tasks marked completed.
2. No known critical bug remains.
3. `system_map.md` updated.
4. `update-execution-tracker.md` updated.
5. API smoke test passed.
6. Frontend build passed.
7. No sensitive file committed.
8. No `.env` secret leaked.
9. Server resource remains stable.
10. No Cloudflare 502 after deploy.

---


# ITZ-App — Update Execution Tracker

> Purpose: Tracking pengerjaan update berdasarkan UPDATE_MD.md  
> Rule: Selesaikan issue existing dari system_map.md dulu sebelum fitur baru.

---

# Status Legend

| Status | Meaning |
|---|---|
| NOT_STARTED | Belum dikerjakan |
| IN_PROGRESS | Sedang dikerjakan |
| BLOCKED | Terhambat |
| NEED_REVIEW | Butuh review manual |
| DONE | Selesai |
| SKIPPED | Dilewati dengan alasan jelas |

---

# 1. System Map Cleanup & Existing Issues

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| SYS-01 | Update system_map.md sesuai kondisi terbaru production | Critical | DONE | Rewrite menyeluruh: workers=1, bind 127.0.0.1, .env 600, .git retained, Cloudflare arch, security sections |
| SYS-02 | Reconcile deployment policy | Critical | DONE | Section 11 diupdate: build lokal, commit build, server git pull, policy wajib |
| SYS-03 | Document .git security policy | Critical | DONE | Section 15 Security Policy + Section 2.2 server status |
| SYS-04 | Document VPS resource/OOM policy | High | DONE | Section 16 VPS Resource Policy: insiden OOM, workers=1, swap, monitoring |
| SYS-05 | Update environment variable documentation | High | DONE | Section 9 diupdate: semua 8 keys, .env.example lengkap, frontend .env.example dibuat |
| SYS-06 | Update production architecture diagram | High | DONE | Section 1 diupdate: Cloudflare → Nginx → Uvicorn, rate limit, security layers |

---

# 2. Immediate Fixes from system_map.md

| ID | Task | Priority | Status | Acceptance |
|---|---|---:|---|---|
| FIX-01 | Add GK Latihan to DashboardLayout nav | High | DONE | ALL_NAV sudah ada entry `/app/training/gk` |
| FIX-02 | Add GK Latihan to CommandPalette | High | DONE | ALL_NAV_TARGETS sudah ada entry GK Latihan |
| FIX-03 | Add GK Latihan to TrainingHub | Medium | DONE | modules array sudah ada `key: "gk"` |
| FIX-04 | Audit and remove unused Landing.js | Medium | DONE | File tidak ada di disk, tidak ada import |
| FIX-05 | Complete backend .env.example | High | DONE | 8 required keys + workers note + backup note |
| FIX-06 | Complete frontend .env.example | Medium | DONE | frontend/.env.example dibuat dengan REACT_APP_BACKEND_URL |
| FIX-07 | Audit unused backend dependencies | Medium | DONE | boto3, pandas, numpy, emergentintegrations sudah dihapus dari requirements.txt |
| FIX-08 | Audit unused frontend dependencies | Medium | DONE | @emergentbase/visual-edits di devDependencies (dev-only, tidak masuk production bundle) |
| FIX-09 | Confirm Nginx blocks .git and dotfiles | Critical | DONE | Verified: /.git/config → 404, /.env → 404, /.well-known/ → 200 |
| FIX-10 | Confirm backend service resource policy | Critical | DONE | bind 127.0.0.1:8000, workers=1, UFW deny 8000 verified |

---

# 3. Phase 1 — Stabil & Trust

## 3.1 Health Check

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-HC-01 | Create public health endpoint | Critical | DONE | GET /api/health — returns status, env, timestamp. server.py |
| P1-HC-02 | Create DB health endpoint | Critical | DONE | GET /api/health/db — ping MongoDB + user count. server.py |
| P1-HC-03 | Add health check documentation | Medium | DONE | system_map.md Section 18 |
| P1-HC-04 | Add server health check script | Medium | DONE | scripts/health_check.sh — curl /api/health + /api/health/db + public/.git/.env + ss:port 8000 + systemd itz-backend/mongod. Safe read-only. |

---

## 3.2 MongoDB Backup

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-BK-01 | Create MongoDB backup plan | Critical | DONE | backup_mongo.sh: mongodump + gzip, cron 02:00 UTC, /var/backups/mongodb/ |
| P1-BK-02 | Create backup script | Critical | DONE | backup_mongo.sh fixed (variable bug), log prefix, cleanup count |
| P1-BK-03 | Add retention policy | High | DONE | KEEP_DAYS=7, find -mtime +7 -delete |
| P1-BK-04 | Add backup logs | Medium | DONE | LOG_PREFIX timestamp, cron >> /var/log/mongo_backup.log |
| P1-BK-05 | Add restore instruction | High | DONE | RESTORE_GUIDE.md: full/partial/temp restore + verify + cleanup |

---

## 3.3 Forgot Password

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-FP-01 | Add password_reset_tokens collection spec | High | DONE | Schema + indexes in server.py startup (token_hash unique, user_id+used, expires_at) |
| P1-FP-02 | Create forgot password endpoint | High | DONE | POST /api/auth/forgot-password — anti-enumeration, invalidates old tokens, 60-min TTL, logs reset link |
| P1-FP-03 | Create reset password endpoint | High | DONE | POST /api/auth/reset-password — validates token, updates password, clears brute-force lockouts, audit-logged |
| P1-FP-04 | Create ForgotPassword page | High | DONE | frontend/src/pages/ForgotPassword.js — anti-enumeration UX, success state, link ke login |
| P1-FP-05 | Create ResetPassword page | High | DONE | frontend/src/pages/ResetPassword.js — token dari ?token=, auto-redirect ke login setelah reset |
| P1-FP-06 | Add admin reset fallback | Medium | DONE | POST /api/auth/admin-reset-password — superadmin only, audit-logged |

---

## 3.4 Pagination

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-PG-01 | Define standard pagination response | High | DONE | _paginate_meta() helper di server.py — {page,limit,total,pages,has_next,has_prev} |
| P1-PG-02 | Add pagination to users endpoint | High | DONE | GET /api/users?page=1&limit=20&search=&status=&role= |
| P1-PG-03 | Add pagination to transactions endpoint | High | DONE | GET /api/transactions?page=1&limit=20&status= |
| P1-PG-04 | Add pagination to notifications endpoint | High | DONE | GET /api/notifications?page=1&limit=20 |
| P1-PG-05 | Add pagination to promos endpoint | Medium | DONE | GET /api/promos?page=1&limit=20 |
| P1-PG-06 | Add pagination to news/events | Medium | DONE | GET /api/news + /api/events?page=1&limit=20&published_only=true |
| P1-PG-07 | Update ResponsiveTable pagination UI | High | DONE | ResponsiveTable.js: PaginationBar + loading skeleton + getPageNumbers. Props: meta, onPageChange, loading |

---

## 3.5 Audit Log

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-AU-01 | Add audit_logs collection | High | DONE | MongoDB collection auto-created, indexes added in startup |
| P1-AU-02 | Add audit helper spec | High | DONE | _audit_log() helper in server.py — non-blocking, logs to db.audit_logs |
| P1-AU-03 | Log transaction approve/reject | High | DONE | approve_tx + reject_tx call _audit_log() |
| P1-AU-04 | Log user role/status update | High | DONE | update_user + delete_user call _audit_log() |
| P1-AU-05 | Log payment config update | High | DONE | update_payment_config calls _audit_log() |
| P1-AU-06 | Create audit logs admin page | Medium | DONE | GET /api/audit-logs (superadmin only, paginated, filterable) |

---

## 3.6 Rate Limit

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P1-RL-01 | Add login rate limit | Critical | DONE | Nginx: api_auth zone 5r/m burst=10, /api/auth/ → 429 on exceed |
| P1-RL-02 | Add register rate limit | High | DONE | Included in api_auth zone (same /api/auth/ location block) |
| P1-RL-03 | Add forgot password rate limit | High | DONE | Covered by api_auth Nginx zone (/api/auth/forgot-password masuk /api/auth/) |
| P1-RL-04 | Add promo validate rate limit | Medium | DONE | Nginx zone api_promo 10r/m + backend _rate_check 10r/min per IP (defense-in-depth) |
| P1-RL-05 | Add calculator run rate limit | Medium | DONE | Nginx zone api_calc 20r/m + backend _rate_check 20r/min per user_id |

---

# 4. Phase 2 — Product Value

## 4.1 Save Result

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P2-SR-01 | Add training_results collection | Very High | DONE | Schema di models.py TrainingResultSave, indexes di startup (user_id+created_at, id unique) |
| P2-SR-02 | Add save result endpoint | Very High | DONE | POST /api/training-results + GET list + GET detail + PATCH note + DELETE |
| P2-SR-03 | Add Save Result button | Very High | DONE | ResultSection di shared.js: FloppyDisk btn, note input, idle/saving/saved/error states |
| P2-SR-04 | Add result note | Medium | DONE | Included in P2-SR-03 — toggle note input, PATCH /note endpoint |
| P2-SR-05 | Add result detail endpoint/page | High | NOT_STARTED | history detail page |

---

## 4.2 History Latihan

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P2-HL-01 | Create Training History route | Very High | NOT_STARTED | /app/training/history |
| P2-HL-02 | Create history list UI | Very High | NOT_STARTED | paginated |
| P2-HL-03 | Create result detail UI | High | NOT_STARTED | route detail |
| P2-HL-04 | Add duplicate simulation | Medium | NOT_STARTED | reuse input |
| P2-HL-05 | Add compare result | Medium | NOT_STARTED | optional |

---

## 4.3 Dashboard Progress

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P2-DP-01 | Add user progress API | High | NOT_STARTED | dashboard |
| P2-DP-02 | Add overall chart | High | NOT_STARTED | Recharts |
| P2-DP-03 | Add attribute radar | Medium | NOT_STARTED | Recharts |
| P2-DP-04 | Add last training card | High | NOT_STARTED | retention |
| P2-DP-05 | Add recommended next training | Medium | NOT_STARTED | simple logic |

---

## 4.4 Preset Posisi

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P2-PR-01 | Define preset schema | High | NOT_STARTED | field + GK |
| P2-PR-02 | Add preset data/API | High | NOT_STARTED | static or DB |
| P2-PR-03 | Add preset selector Full Latihan | High | NOT_STARTED | UX |
| P2-PR-04 | Add preset selector Single Drill | High | NOT_STARTED | UX |
| P2-PR-05 | Add preset selector GK Latihan | High | NOT_STARTED | UX |
| P2-PR-06 | Add admin preset manager | Low | NOT_STARTED | optional |

---

## 4.5 Training Plan Generator

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P2-TP-01 | Add training_plans collection | Medium-High | NOT_STARTED | plans |
| P2-TP-02 | Add generate plan endpoint | Medium-High | NOT_STARTED | from simulation |
| P2-TP-03 | Add plan list page | Medium | NOT_STARTED | user |
| P2-TP-04 | Add plan detail page | Medium | NOT_STARTED | day-by-day |
| P2-TP-05 | Add complete day action | Medium | NOT_STARTED | checklist |

---

# 5. Phase 3 — Monetisasi

## 5.1 Invoice Manual

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P3-INV-01 | Add invoice fields to transactions | High | NOT_STARTED | invoice_number |
| P3-INV-02 | Add checkout flow | High | NOT_STARTED | package purchase |
| P3-INV-03 | Add invoice detail page | High | NOT_STARTED | user |
| P3-INV-04 | Add transaction status improvement | High | NOT_STARTED | pending/waiting/approved |

---

## 5.2 Upload Bukti Transfer

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P3-UP-01 | Define upload storage policy | High | NOT_STARTED | local/object |
| P3-UP-02 | Add upload proof endpoint | High | NOT_STARTED | form-data |
| P3-UP-03 | Add file validation | High | NOT_STARTED | type/size |
| P3-UP-04 | Add admin proof preview | High | NOT_STARTED | approve/reject |

---

## 5.3 Package Upgrade/Downgrade

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P3-PKG-01 | Define upgrade policy v1 | Medium | NOT_STARTED | simple replace |
| P3-PKG-02 | Add transaction_type | Medium | NOT_STARTED | new/renew/upgrade |
| P3-PKG-03 | Add package card dashboard | Medium | NOT_STARTED | current package |
| P3-PKG-04 | Add renewal flow | Medium | NOT_STARTED | checkout reuse |

---

## 5.4 Promo Tracking

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P3-PT-01 | Add promo_usages collection | Medium-High | NOT_STARTED | tracking |
| P3-PT-02 | Track promo on checkout | Medium-High | NOT_STARTED | usage |
| P3-PT-03 | Add promo performance API | Medium | NOT_STARTED | marketing |
| P3-PT-04 | Add promo performance UI | Medium | NOT_STARTED | dashboard |

---

## 5.5 Marketing Commission Report

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P3-MC-01 | Define commission policy | Medium | NOT_STARTED | percent/fixed |
| P3-MC-02 | Add commission report API | Medium | NOT_STARTED | marketing |
| P3-MC-03 | Add marketing commission page | Medium | NOT_STARTED | marketing |
| P3-MC-04 | Add admin payout page | Medium | NOT_STARTED | admin |

---

# 6. Phase 4 — Growth

## 6.1 Share Result

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P4-SH-01 | Add share fields to training_results | Medium | NOT_STARTED | slug/public |
| P4-SH-02 | Add public share page | Medium | NOT_STARTED | /share/result/:slug |
| P4-SH-03 | Add copy summary | Medium | NOT_STARTED | text share |
| P4-SH-04 | Add WhatsApp share | Medium | NOT_STARTED | growth |
| P4-SH-05 | Add image share | Low | NOT_STARTED | optional |

---

## 6.2 Leaderboard

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P4-LB-01 | Add leaderboard opt-in fields | Medium | NOT_STARTED | privacy |
| P4-LB-02 | Add leaderboard API | Medium | NOT_STARTED | overall/streak |
| P4-LB-03 | Add leaderboard page | Medium | NOT_STARTED | user/public |
| P4-LB-04 | Add weekly/monthly filters | Low | NOT_STARTED | optional |

---

## 6.3 Community Event Reward

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P4-RW-01 | Add reward fields to events | Medium | NOT_STARTED | reward_enabled |
| P4-RW-02 | Add user_rewards collection | Medium | NOT_STARTED | rewards |
| P4-RW-03 | Add grant reward admin action | Medium | NOT_STARTED | event admin |
| P4-RW-04 | Add user rewards page | Medium | NOT_STARTED | user |
| P4-RW-05 | Add reward notification | Medium | NOT_STARTED | notification |

---

## 6.4 Certificate/Event Badge

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P4-CB-01 | Add certificates collection | Medium-Low | NOT_STARTED | event |
| P4-CB-02 | Add certificate verify page | Medium-Low | NOT_STARTED | public |
| P4-CB-03 | Add badges collection | Medium-Low | NOT_STARTED | gamification |
| P4-CB-04 | Add user_badges collection | Medium-Low | NOT_STARTED | achievements |
| P4-CB-05 | Add badge display in dashboard | Low | NOT_STARTED | profile |

---

## 6.5 Referral System

| ID | Task | Priority | Status | Notes |
|---|---|---:|---|---|
| P4-RF-01 | Add referral fields to users | Low-Medium | NOT_STARTED | referral_code |
| P4-RF-02 | Add referrals collection | Low-Medium | NOT_STARTED | tracking |
| P4-RF-03 | Add register with referral | Low-Medium | NOT_STARTED | ?ref= |
| P4-RF-04 | Add referral dashboard card | Low | NOT_STARTED | copy link |
| P4-RF-05 | Add referral reward logic | Low | NOT_STARTED | after payment |

---

# 7. Final Verification Checklist

## Backend

| Check | Status |
|---|---|
| Health endpoint OK | NOT_STARTED |
| DB health OK | NOT_STARTED |
| Login OK | NOT_STARTED |
| Auth/me OK | NOT_STARTED |
| Calculator meta OK | NOT_STARTED |
| Calculator run OK | NOT_STARTED |
| Pagination OK | NOT_STARTED |
| Audit log inserted | NOT_STARTED |
| Rate limit works | NOT_STARTED |

---

## Frontend

| Check | Status |
|---|---|
| Build success | NOT_STARTED |
| Public pages OK | NOT_STARTED |
| Login/register OK | NOT_STARTED |
| Dashboard nav OK | NOT_STARTED |
| GK Latihan visible | NOT_STARTED |
| Admin pages OK | NOT_STARTED |
| Marketing pages OK | NOT_STARTED |
| Training history OK | NOT_STARTED |

---

## Server

| Check | Status |
|---|---|
| Nginx config valid | NOT_STARTED |
| Backend active | NOT_STARTED |
| MongoDB active | NOT_STARTED |
| Port 8000 localhost only | NOT_STARTED |
| UFW 8000 denied | NOT_STARTED |
| Swap active | NOT_STARTED |
| `.git/config` returns 404 | NOT_STARTED |
| `.env` returns 404 | NOT_STARTED |
| API public returns 200 | NOT_STARTED |
| No Cloudflare 502 | NOT_STARTED |

---

# 8. Notes

- Jangan push secret.
- Jangan commit `.env`.
- Jangan hapus `.git` di server.
- Jangan jalankan workers 2 pada VPS kecil.
- Jangan langsung masuk fitur growth sebelum Phase 1 dan Phase 2 core selesai.
- Setiap perubahan besar wajib update `system_map.md`.

---

