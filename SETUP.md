# Run guide

Needs Node.js 18+ and MongoDB (local or Atlas).

## 1. Server
```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env  (then edit MONGO_URI if using Atlas)
npm run seed                # 40 users, 30 products, 300 orders (WIPES those collections)
npm run seed:reviews        # reviews tied to real purchases
npm run dev                 # http://localhost:5000
```

## 2. Client (second terminal)
```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```
Browse products on the Storefront tab. Use "Signed in as" (top right) to pick a user; choose the admin user to open the Admin tab.

## 3. Index benchmark for the DBMS report
```bash
cd server
npm run explain             # prints WITHOUT vs WITH index (scan type, docs examined, time)
```

## 4. Endpoints (test in Postman)
| Method | URL | Auth headers |
|---|---|---|
| POST | /api/products/:id/reviews  body {"rating":4,"comment":"Nice"} | x-test-user-id |
| GET  | /api/products/:id/reviews | none |
| GET  | /api/products/:id/reviews/summary | none |
| GET  | /api/products/:id/also-bought | none |
| GET  | /api/analytics/segments | x-test-user-id + x-test-role: admin |
| GET  | /api/dev/users, /api/dev/products | none (gives you real ids to test with) |

## 5. When merging with A and B
- Delete server/src/middleware/auth.js and use the real one (keep exports `protect`, `requireAdmin`).
- Delete models User.js, Product.js, Order.js and use the shared ones. Keep model names `User`, `Product`, `Order`, and keep `orderSchema.index({ 'items.product': 1 })` in Order.
- Delete devRoutes.js and the `/dev` line in routes/index.js.
- Add one line per route file to the shared routes/index.js and analyticsRoutes.js.
- Reuse the components in the real pages: `<ReviewSection productId isLoggedIn />` and `<AlsoBoughtStrip productId />` on the product detail page, and `<SegmentsChart />` in the admin dashboard.
- In client/src/api/axios.js replace the test-header stub with the real token header.
