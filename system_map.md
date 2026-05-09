# TE Sniper — System Map

## Gambaran Umum

Aplikasi web full-stack untuk mengoptimalkan latihan pemain di game **Top Eleven**. Sistem menghitung kombinasi drill paling efisien berdasarkan posisi pemain, atribut saat ini, dan target mutu yang diinginkan.

**Stack:** FastAPI (Python) + MongoDB + React 19 + Tailwind CSS  
**Deployment:** Uvicorn (port 8001) + Craco dev server (port 3000)

---

## Struktur Direktori

```
/app/
├── backend/
│   ├── server.py          — FastAPI app, semua endpoint API
│   ├── auth.py            — JWT, bcrypt, brute-force protection
│   ├── calculator.py      — Engine simulator drill (core logic)
│   ├── models.py          — Pydantic request schemas
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.js                     — React Router (semua routes)
│       ├── context/AuthContext.js     — Auth state global
│       ├── lib/api.js                 — Axios instance + error formatter
│       ├── components/
│       │   ├── DashboardLayout.js     — Sidebar + mobile nav
│       │   ├── ProtectedRoute.js      — Auth guard per role
│       │   └── ResponsiveTable.js     — Table generik
│       └── pages/
│           ├── Landing.js             — Halaman publik
│           ├── Login.js / Register.js
│           ├── UserOverview.js        — Dashboard user
│           ├── TrainingHub.js         — Pilihan modul latihan
│           ├── MarketingDashboard.js
│           ├── AdminDashboard.js
│           ├── training/
│           │   ├── FullLatihan.js     — Sniper multi-prioritas (field only)
│           │   ├── SingleDrill.js     — Fokus 1 drill (field + GK)
│           │   ├── GKLatihan.js       — Kalkulator kiper
│           │   └── shared.js          — PlayerForm, TargetCard, ResultSection, runCalculator
│           └── admin/
│               ├── Users.js
│               ├── Packages.js
│               ├── Promos.js
│               ├── Transactions.js
│               ├── Cms.js             — News & Events
│               └── PaymentConfig.js
├── te-sniper.html         — Versi standalone offline (HTML/JS)
└── system_map.md          — Dokumen ini
```

---

## Routes Frontend

| Path | Komponen | Roles yang Diizinkan |
|---|---|---|
| `/` | Landing | Publik |
| `/login` | Login | Publik |
| `/register` | Register | Publik |
| `/app` | AppHome (redirect by role) | Semua |
| `/app/training` | TrainingHub | user, admin, superadmin |
| `/app/training/full` | FullLatihan | user, admin, superadmin |
| `/app/training/single` | SingleDrill | user, admin, superadmin |
| `/app/training/gk` | GKLatihan | user, admin, superadmin |
| `/app/calculator` | → redirect ke /app/training | — |
| `/app/admin` | AdminDashboard | admin, superadmin |
| `/app/admin/users` | AdminUsers | admin, superadmin |
| `/app/admin/packages` | AdminPackages | admin, superadmin |
| `/app/admin/promos` | AdminPromos | admin, superadmin, marketing |
| `/app/admin/transactions` | AdminTransactions | admin, superadmin |
| `/app/admin/news` | AdminNews | admin, superadmin |
| `/app/admin/events` | AdminEvents | admin, superadmin |
| `/app/admin/payment` | PaymentConfig | superadmin |
| `/app/marketing` | MarketingDashboard | marketing, admin, superadmin |

---

## API Endpoints Backend

Base prefix: `/api`

### Auth
| Method | Path | Keterangan |
|---|---|---|
| POST | `/auth/register` | Daftar user baru (butuh package_id + opsional promo) |
| POST | `/auth/login` | Login → set httpOnly cookie access+refresh token |
| GET | `/auth/me` | Ambil data user + info paket aktif |
| POST | `/auth/logout` | Hapus auth cookies |
| POST | `/auth/refresh` | Perbarui access token dari refresh token |

### Users (Admin)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/users` | List semua user |
| POST | `/users` | Admin buat user manual |
| PATCH | `/users/{user_id}` | Update role, status, expiry, paket |
| DELETE | `/users/{user_id}` | Hapus user (superadmin) |

### Packages
| Method | Path | Keterangan |
|---|---|---|
| GET | `/packages` | List paket (publik: active only; admin: semua) |
| POST | `/packages` | Buat paket baru |
| PATCH | `/packages/{pkg_id}` | Update paket |
| DELETE | `/packages/{pkg_id}` | Hapus paket (superadmin) |

### Promos
| Method | Path | Keterangan |
|---|---|---|
| GET | `/promos` | List promo (marketing: hanya milik sendiri) |
| POST | `/promos` | Buat kode promo |
| PATCH | `/promos/{promo_id}` | Update promo |
| DELETE | `/promos/{promo_id}` | Hapus promo |
| GET | `/promos/validate/{code}` | Validasi kode & hitung diskon |

### Transactions
| Method | Path | Keterangan |
|---|---|---|
| GET | `/transactions` | List transaksi |
| POST | `/transactions/{tx_id}/approve` | Admin approve → aktifkan paket |
| POST | `/transactions/{tx_id}/reject` | Admin reject transaksi |

### News & Events
| Method | Path | Keterangan |
|---|---|---|
| GET/POST | `/news` | List / buat berita |
| PATCH/DELETE | `/news/{nid}` | Update / hapus berita |
| GET/POST | `/events` | List / buat event |
| PATCH/DELETE | `/events/{eid}` | Update / hapus event |
| POST | `/events/{eid}/register` | User daftar event |
| GET | `/event-registrations` | List pendaftaran |
| POST | `/event-registrations/{rid}/approve` | Approve pendaftaran |
| POST | `/event-registrations/{rid}/reject` | Reject pendaftaran |

### Dashboard & Config
| Method | Path | Keterangan |
|---|---|---|
| GET | `/dashboard/admin` | KPI admin (user, revenue, pending) |
| GET | `/dashboard/marketing` | Statistik marketing (earning, konversi) |
| GET/PATCH | `/payment-config` | Konfigurasi metode pembayaran (superadmin) |

### Calculator
| Method | Path | Keterangan |
|---|---|---|
| GET | `/calculator/meta` | Metadata: drills, roles, attrs, gk_attrs |
| POST | `/calculator/run` | Jalankan simulasi (cek expiry + click limit) |

---

## Database Collections (MongoDB)

| Collection | Field Utama | Keterangan |
|---|---|---|
| `users` | email, password_hash, role, status, package_id, expires_at, clicks_used, max_clicks | Akun pengguna |
| `login_attempts` | identifier, attempts, locked_until | Brute-force protection |
| `packages` | name, price, duration_type, duration_value, max_clicks, is_trial, active | Paket berlangganan |
| `promos` | code, discount_type, discount_value, max_uses, valid_until, owner_marketing_id | Kode diskon |
| `transactions` | user_id, package_id, amount, discount, status, promo_code, approved_by | Riwayat pembayaran |
| `news` | title, content, image_url, published, author_id | Artikel berita |
| `events` | title, content, event_date, registration_required, published | Event komunitas |
| `event_registrations` | event_id, user_id, status, note, approved_by | Pendaftaran event |
| `payment_config` | manual_enabled, xendit_*, midtrans_*, bank_info | Konfigurasi payment |

---

## Sistem Role & Akses

```
superadmin  — akses penuh semua fitur + payment config + delete
admin       — manajemen user/paket/transaksi/CMS (tidak bisa delete)
marketing   — hanya promo milik sendiri + dashboard marketing
user        — akses latihan (dibatasi expiry + click limit jika paket trial)
```

**User status flow:**
```
register → pending → [admin approve] → active
                   → [admin reject]  → rejected
```

---

## Auth Flow (JWT)

```
Login
  → bcrypt verify password
  → cek status "active" & expiry
  → issue access token (12 jam) + refresh token (30 hari)
  → set sebagai httpOnly cookie (SameSite=None, Secure)

Request terproteksi
  → backend baca cookie → decode JWT → ambil user dari DB

Token habis
  → frontend POST /auth/refresh → dapat access token baru

Brute-force: 5 gagal → lock 15 menit (by IP:email)
```

---

## Modul Latihan — Arsitektur

### Tiga Mode Terpisah

| Modul | File | GK | Keterangan |
|---|---|---|---|
| Full Latihan | `FullLatihan.js` | Tidak ada | Multi-prioritas, semua drill dieksplorasi, hanya posisi field |
| Single Drill | `SingleDrill.js` | Tersedia | Fokus 1 drill pilihan user; GK eksklusif dengan atribut GK |
| GK Latihan | `GKLatihan.js` | Hanya GK | Kalkulator khusus kiper, semua atribut kiper terang |

### Shared Components (`shared.js`)

```
PlayerForm       — Input data pemain: posisi, atribut, bonus jenjang, limit gelap, multiplier
                   Props: fieldOnly=true (FullLatihan) | gkMode=true (GKLatihan) | default (SingleDrill)
                   - fieldOnly: sembunyikan GK dari pill, hanya tombol contoh MC
                   - gkMode: sembunyikan pill (GK fixed), tampilkan grid GK attrs
                   - Ganti posisi → SingleDrill auto-reset pilihan drill

TargetCard       — Card pilih target atribut: toggle aktif/nonaktif, set goal, set prioritas

ResultSection    — Tampilkan hasil: overall %, rute latihan, detail per siklus, FinalGrid
                   Props: gkMode=true → kolom Kiper Teknis/Atletis/Fisik

runCalculator    — Fungsi async POST /calculator/run (dipakai semua 3 halaman)
```

### Engine Simulator (`calculator.py`)

```python
simulate_sniper(
    init_stats,       # nilai atribut awal
    white_set,        # set atribut kuncian (terang)
    targets,          # [{name, goal, prio}] — target mutu
    grey_limit,       # batas sesi atribut gelap (default 40)
    drill_filter,     # single drill mode
    white_multiplier, # berapa kali terang vs gelap per sesi (1/2/3)
    valid_attrs,      # filter atribut per mode: FIELD_ALL_ATTRS atau GK_ALL_ATTRS
)
```

**Empat batasan per drill (diambil minimum):**
1. **Avg Cap 180%** — rata-rata semua atribut drill ≤ 180
2. **Grey Limit** — atribut gelap tidak melewati batas
3. **Goal Cap** — atribut terang ≤ min(goal, 340); atribut gelap ≤ goal
4. **ATTR_CAP = 340** — batas keras per atribut (base, sebelum bonus jenjang)

**Sorting kandidat drill:**
1. Lebih banyak target aktif belum selesai → diprioritaskan
2. Drill lebih kecil (hemat cost)
3. Lebih sedikit atribut gelap (hemat limit)
4. Lebih banyak hit total ke target aktif

### Atribut & Posisi

**Field Player (15 atribut):**
```
Pertahanan: Tekel, Penjagaan, Penempatan, Sundulan, Keberanian
Menyerang:  Umpan, Dribel, UmpanSilang, Tembakan, Penyelesaian
Fisik:      Kebugaran, Kekuatan, Agresivitas, Kecepatan, Kreativitas
```

**GK (15 atribut):**
```
Kiper Teknis:  Refleks, Antisipasi, Konsentrasi, KeluarSarang, Komunikasi
Kiper Atletis: JangkauanUdara, Tinjuan, Lemparan, Sepakan, Kelincahan
Fisik:         Kebugaran (terang), Kekuatan, Agresivitas, Kecepatan, Kreativitas (gelap)
```

**Posisi field (8 posisi):** MC, AMC, ST, DL/DR, DC, DMC, AML/AMR, MR/ML  
**Posisi GK:** Eksklusif, tidak bisa dikombinasi dengan posisi field

**Drills DB:** 29 drill, cost 0.75–3.75, setiap drill punya 2–6 atribut aktif  
Tiap drill mengandung atribut field **dan** GK — disaring oleh `valid_attrs` sesuai mode:
- Field mode → hanya `FIELD_ALL_ATTRS` dihitung
- GK mode → hanya `GK_ALL_ATTRS` dihitung

---

## Environment Variables

**Backend (`backend/.env`):**
```
MONGO_URL          — MongoDB connection string
DB_NAME            — Nama database
CORS_ORIGINS       — Frontend URL (untuk CORS)
JWT_SECRET         — Secret key signing JWT
ADMIN_EMAIL        — Email superadmin awal (di-seed saat startup)
ADMIN_PASSWORD     — Password superadmin awal
FRONTEND_URL       — URL frontend (untuk cookie SameSite)
```

**Frontend (`frontend/.env`):**
```
REACT_APP_BACKEND_URL  — Base URL API backend
WDS_SOCKET_PORT        — WebSocket port untuk hot reload
ENABLE_HEALTH_CHECK    — Flag health check (false di production)
```

---

## Dependensi Utama

**Backend (Python):**
- `FastAPI` + `Uvicorn` — web framework + ASGI server
- `Motor` — async MongoDB driver
- `Pydantic v2` — validasi request/response
- `PyJWT` + `bcrypt` — autentikasi

**Frontend (Node):**
- `React 19` + `React Router DOM 7` — UI framework + routing
- `Axios` — HTTP client
- `React Hook Form` + `Zod` — form & validasi
- `Tailwind CSS` — utility-first styling
- `Framer Motion` — animasi
- `Recharts` — chart dashboard
- `Radix UI` — komponen UI primitif
- `Phosphor Icons` + `Lucide React` — ikon

---

## Alur Data Kalkulator (End-to-End)

```
User input atribut + posisi + target
        ↓
[Frontend] runCalculator() → POST /api/calculator/run
        ↓
[Backend] Validasi expiry & click limit user
        ↓
Build white_set dari ROLES_DB[roles]
        ↓
Strip bonus dari atribut terang (visible → base value)
        ↓
simulate_sniper(valid_attrs = FIELD_ALL_ATTRS | GK_ALL_ATTRS)
  ├─ Loop tiap priority
  ├─ Filter kandidat drill (valid_attrs)
  ├─ Sort: unfinished hits > size > dark count > total hits
  └─ Hitung sesi optimal: min(avg_room, grey_room, goal_room)
        ↓
Hitung overall % dari final_stats / 15 atribut relevan
        ↓
Return: history, final_stats, overall, total_cost, white_set
        ↓
[Frontend] ResultSection → DrillCard timeline + FinalGrid
```
