# Admin portal — `tathaastu-admin_frontend`

Next.js 14 App Router admin dashboard for Tathaastu.

## Run

```bash
cd tathaastu-admin_frontend
cp env.example .env   # PORT=3003, BACKEND_URL=http://localhost:3024
npm install
npm run dev           # http://localhost:3003
```

`next.config.js` rewrites `/api/*` and `/uploads/*` → `BACKEND_URL`.

## Live (backend-backed) pages

| Route | API |
|-------|-----|
| `/products` | `/api/products*` |
| `/store-orders` | `/api/store/admin/orders*` |
| `/queries`, `/ppt-builder` | `/api/queries*` |
| `/recommendations` | `/api/remedies*` |

## Mostly mock / UI-only

`/users`, `/courses`, `/orders` (legacy), `/events`, `/reports`, `/notifications`, `/settings`

## Auth

Client-side Zustand bypass (`store/authStore.ts`) — no real admin JWT yet. Login is development bypass.

## Couples to

- Backend: `tathaastu-admin-backend`
- Storefront: `abhimantrit` (reads products / creates store orders this UI fulfills)
