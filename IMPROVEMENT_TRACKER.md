# ITZ-App — Improvement Tracker

> Last Updated: 2026-05-27  
> Maintainer: opencode assistant  
> Policy: Improve existing, don't expand scope. MVP is done.

---

## Config Reference (Server .env)

```
MAX_HISTORY_PER_USER=15    # Ubah angka ini untuk limit history per user
FRONTEND_URL=https://indotimezone.store
CORS_ORIGINS=https://indotimezone.store,https://www.indotimezone.store
DB_NAME=itzapp
```

Setelah ubah .env: `sudo systemctl restart itz-backend`

---

## Deploy Flow

```bash
# Lokal
cd frontend && npm run build
cd .. && git add -f frontend/build/ && git add <changed files>
git commit -m "..." && git push origin main

# Server (ssh itzadmin@server)
cd /var/www/itz-app && sudo git pull origin main
sudo systemctl restart itz-backend   # hanya jika backend berubah
```

---

## Completed (2026-05-27)

| # | Task | Detail |
|---|------|--------|
| 1 | Security hardening | Fail2ban, SSH key-only, root disabled, user itzadmin |
| 2 | SSL/HTTPS | Let's Encrypt + Cloudflare, auto-renewal |
| 3 | apt upgrade | 124 packages patched |
| 4 | Fix frontend localhost bug | .env.production + relative /api URL |
| 5 | Fix duplicate endpoints | Removed duplicate training-results block |
| 6 | Fix MongoDB backup | DB name itz_app → itzapp, cron fixed |
| 7 | Fix CORS | Whitelist production domain only |
| 8 | Fix Pydantic validation | int → float for calculator & training-results models |
| 9 | Training history: title field | Auto-generate or custom title per session |
| 10 | Training history: limit 15 | Configurable via MAX_HISTORY_PER_USER env |
| 11 | TrainingHistory UI | Show title, capacity badge (X/15) |
| 12 | Clean old build files | Removed stale JS bundles from server |

---

## Known State

- Branch: `main` (synced local ↔ GitHub ↔ server)
- Backend: FastAPI on uvicorn, systemd managed
- Frontend: React 19, build committed to repo
- DB: MongoDB `itzapp`, 7 users, backup daily 02:00 UTC
- Billing: Manual (admin approve transactions)
- Payment gateway: Schema ready (xendit/midtrans fields in PaymentConfig) but not wired

---

## Next Improvements (Prioritized)

### Tier 1 — Polish Existing

- [ ] User progress dashboard (chart overall over time)
- [ ] Session compare (side-by-side 2 results)
- [ ] Better error messages across all forms
- [ ] Loading states consistency check
- [ ] Mobile responsive audit

### Tier 2 — Small Wins

- [ ] Email notification on registration/approval
- [ ] Export result to image (screenshot-friendly view)
- [ ] Public share link (share_slug field already exists)
- [ ] Forgot password flow (pages exist, backend endpoint TBD)

### Tier 3 — Future (Don't Touch Yet)

- [ ] Payment gateway integration
- [ ] PWA / offline support
- [ ] Multi-language
- [ ] Team/club management

---

## Rules for Future Development

1. Build locally, commit build, push, pull on server
2. Never build on server
3. Never run npm install on server
4. Backend .env permission must stay 600
5. Test locally before push
6. One feature per commit, descriptive message
7. Don't expand scope — improve what exists
8. Billing stays manual until explicitly requested
