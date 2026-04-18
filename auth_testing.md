# Auth Testing Playbook

## Seeded Superadmin Credentials
- Email: `superadmin@tesniper.com`
- Password: `SuperAdmin@2026`
- Role: `superadmin`

## API Endpoints
- POST `/api/auth/register` — body: `{email, password, password2, name, association?, package_id, promo_code?}`
- POST `/api/auth/login` — body: `{email, password}`
- POST `/api/auth/logout`
- GET  `/api/auth/me`
- POST `/api/auth/refresh`

## Quick Test
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c /tmp/c.txt -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"superadmin@tesniper.com","password":"SuperAdmin@2026"}'
curl -b /tmp/c.txt "$API_URL/api/auth/me"
```

## MongoDB Verification
```
mongosh
use te_sniper_db
db.users.find({role: "superadmin"}).pretty()
```

- bcrypt hash starts with `$2b$`
- Indexes: users.email(unique), login_attempts.identifier, password_reset_tokens.expires_at(TTL)
