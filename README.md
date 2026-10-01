# E-commerce Analytics + Recommendation Dashboard

A MERN e-commerce app with an admin Business Intelligence dashboard built on MongoDB's aggregation pipeline. Built as a combined **Web Development + Advanced DBMS** mini project by a team of three.

## Project Description

Customers can browse products, add them to a cart, place orders, and leave reviews. Admins get a dashboard with live charts driven by MongoDB aggregation pipelines:

- **Sales trends** over time (monthly revenue, with date-range filter)
- **Top-selling products** by quantity and revenue
- **Customer segments** by spend tier

The storefront also shows **"Customers also bought"** suggestions on product pages, computed from co-purchase patterns in past orders.

### Curriculum Mapping

| Course Unit | Where it shows up |
|---|---|
| DBMS Unit 3 (Aggregation, MapReduce) | Sales trend, top-products, segment, rating, and co-purchase pipelines (`$group`, `$bucket`, `$unwind`, `$lookup`); compound indexing with before/after timing |
| DBMS Unit 5 (Data Mining, BI) | Segmentation and co-purchase analysis; optional association rules, k-means clustering, and collaborative filtering |
| Web Dev | React frontend, Express/Node API, MongoDB, JWT auth, admin dashboard |

## Tech Stack

- **Frontend:** React (Vite), React Router, Recharts, Axios
- **Backend:** Node.js, Express, Mongoose, `jsonwebtoken`, `bcrypt`
- **Database:** MongoDB

## Shared Schema

All three members build against these shapes. Do not change them without telling the team.

```js
// User
{
  name: String,
  email: String,            // unique
  passwordHash: String,
  role: 'customer' | 'admin',
  createdAt: Date
}

// Product
{
  name: String,
  category: String,
  price: Number,
  stock: Number,
  createdAt: Date
}

// Order (items are embedded so pipelines can $unwind them directly)
{
  user: ObjectId,           // ref User
  items: [
    {
      product: ObjectId,    // ref Product
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  total: Number,
  orderDate: Date,
  status: String
}

// Review
{
  product: ObjectId,        // ref Product
  user: ObjectId,           // ref User
  rating: Number,           // 1 to 5
  comment: String,
  createdAt: Date           // unique index on (product, user)
}
```

## Division of Work

Work is split by **feature slice**: every member contributes to the **database, backend, and frontend**, about 15 hours each.

### Shared kickoff (everyone)
- Agree on the schema above.
- Person A sets up the repo skeleton and a seed script (about 1,000 orders, 50 products, 100 users).

### Person A: Auth, Catalog & Sales Trends

| Layer | Work |
|---|---|
| Database | User and Product schemas; seed script; sales-by-month aggregation (`$group` + `$sort`); compound index on `orderDate + productId` with before/after timing |
| Backend | JWT auth (customer/admin roles); product CRUD and category routes; `GET /analytics/sales-trend` |
| Frontend | Signup/login; protected routes; product listing, search, and filter; sales trend line chart with date filter; admin dashboard shell |

### Person B: Cart, Orders & Top Products

| Layer | Work |
|---|---|
| Database | Order schema; top-products aggregation (`$group` by product, sorted by quantity/revenue); low-stock query |
| Backend | Cart and checkout routes (no real payment); order history; `GET /analytics/top-products` |
| Frontend | Product detail page; cart; checkout; order history; top-products bar chart |

### Person C: Reviews, Customer Segments & "Also Bought"

| Layer | Work |
|---|---|
| Database | Review schema; average-rating aggregation (`$group` + `$avg`); spend-tier segments (`$group` by customer + `$bucket`); co-purchase pipeline (`$unwind` order items, `$lookup`/self-join to count product pairs) |
| Backend | Review routes; `GET /analytics/segments`; `GET /products/:id/also-bought` |
| Frontend | Star rating and review UI on the product page; segments pie/bar chart; "Customers also bought" strip |

## API Overview

| Method | Endpoint | Owner |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login` | A |
| GET | `/api/auth/me` | A |
| GET/POST/PUT/DELETE | `/api/products`, `/api/products/:id` | A |
| GET | `/api/products/categories` | A |
| GET | `/api/analytics/sales-trend` | A |
| GET/POST | `/api/cart` (logged in) | B |
| PUT/DELETE | `/api/cart/:productId` (logged in) | B |
| POST | `/api/orders/checkout` (logged in) | B |
| GET | `/api/orders` (logged in, own orders) | B |
| GET | `/api/analytics/top-products`, `/api/analytics/low-stock` | B |
| GET/POST | `/api/products/:id/reviews` (POST needs login) | C |
| GET | `/api/products/:id/reviews/summary` | C |
| GET | `/api/analytics/segments` | C |
| GET | `/api/products/:id/also-bought` | C |

## Repo Structure

```
ecommerce-analytics/
├── server/
│   ├── src/
│   │   ├── config/        # db connection
│   │   ├── models/        # Mongoose schemas
│   │   ├── controllers/
│   │   ├── routes/        # index.js registers all route files
│   │   ├── middleware/    # auth, admin check
│   │   └── app.js
│   ├── scripts/           # seed and mining scripts
│   └── server.js
├── client/
│   └── src/
│       ├── api/           # axios instance
│       ├── components/
│       ├── pages/
│       ├── context/       # auth, cart
│       └── App.jsx
└── docs/
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Server

```bash
cd server
cp .env.example .env       # defaults work for local MongoDB; change JWT_SECRET
npm install
npm run seed:all           # wipes and reloads users, products, orders, then reviews
npm run dev                # API on http://localhost:5000
```

### 2. Client (in a second terminal)

```bash
cd client
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # app on http://localhost:5173
```

### 3. Log in

| Account | Email | Password |
|---|---|---|
| Admin | `admin@shop.com` | `admin123` |
| Customer | any seeded user, or sign up | `password123` |

The admin dashboard is at `/admin`.

### Server scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-reload (nodemon) |
| `npm start` | Start the API |
| `npm run seed` | Load 100 users, 50 products and 1,000 orders (same data on every run) |
| `npm run seed:reviews` | Add sample reviews to the seeded products (run after `seed`) |
| `npm run seed:all` | `seed` then `seed:reviews`: the full demo data set |
| `npm run seed:orders` | Add extra random orders for the existing customers |
| `npm run bench` | Before/after timing for the `orders` compound index (see [docs/indexing-notes.md](docs/indexing-notes.md)) |
| `npm run explain` | `explain()` output for the "also bought" pipeline (see [docs/segments-and-cooccurrence.md](docs/segments-and-cooccurrence.md)) |

### Seed data

`npm run seed` wipes and reloads the `users`, `products` and `orders` collections, and empties `reviews` and `carts`. Run `npm run seed:all` to get reviews back. The data is built so every pipeline has something to find:

- **Orders:** 1,000 orders over the last 18 months, with a November/December peak and steady growth.
- **Order status:** each order is `pending`, `shipped`, `delivered` or `cancelled`, always lowercase. The sales trend leaves out cancelled orders.
- **Customers:** a mix of loyal, regular and occasional buyers, for spend-tier segments.
- **Products:** a few best sellers and a long tail, for top products. Five products are low on stock (under 10).
- **Bought together:** twelve pairs of products often ordered together, such as Shampoo + Conditioner and Smartphone X + Phone Case, for "also bought".

## API Reference (Person A)

Send the token from signup or login as `Authorization: Bearer <token>`. Errors come back as `{ "message": "..." }` with status 400, 401, 403, 404 or 409.

### Auth

```http
POST /api/auth/signup      { "name": "Asha Rao", "email": "asha@example.com", "password": "secret1" }
POST /api/auth/login       { "email": "admin@shop.com", "password": "admin123" }
  -> 200 { "token": "eyJ...", "user": { "_id", "name", "email", "role", "createdAt" } }

GET  /api/auth/me          (logged in) -> { "user": { ... } }
```

Signup always creates a `customer`. The only admin is the one the seed script creates.

### Products

```http
GET /api/products?search=lap&category=Electronics&minPrice=10&maxPrice=500&inStock=true&sort=price_asc&page=1&limit=12
  -> { "products": [...], "total": 2, "page": 1, "pages": 1 }

GET    /api/products/categories   -> { "categories": [{ "category": "Books", "count": 8 }, ...] }
GET    /api/products/:id          -> { "product": { ... } }
POST   /api/products              (admin) { "name", "category", "price", "stock" }
PUT    /api/products/:id          (admin) any of those fields
DELETE /api/products/:id          (admin)
```

- `sort` is one of `name_asc` (the default), `price_asc`, `price_desc` or `newest`.
- `search` matches any part of the product name and ignores case.

### Sales trend (admin)

```http
GET /api/analytics/sales-trend?from=2026-01-01&to=2026-06-30
GET /api/analytics/sales-trend?from=2026-01-01&productId=<productId>
  -> {
       "from": "...", "to": "...", "productId": null,
       "totals": { "revenue": 44072.76, "orders": 293, "units": 824 },
       "data": [ { "period": "2026-01", "year": 2026, "month": 1, "revenue": 5857.8, "orders": 42, "units": 120 }, ... ]
     }
```

- `from` and `to` are optional; leave both out to get all months.
- `to` includes the whole day you give it.
- Months with no orders are left out of `data`. The chart fills them in with zero.
- The pipeline and the index are explained in [docs/indexing-notes.md](docs/indexing-notes.md).

## Integration Notes (A + B + C merged)

The three branches were merged into one app. What changed while integrating:

**Server**
- **One Order shape.** Person B's `Order` model now uses the shared schema (`user`, `items[{ product, name, price, quantity }]`, `total`, `orderDate`, `status`). Checkout, order history, top products, segments and "also bought" all read the same documents the seed writes.
- **Indexes on `orders`:** `{ orderDate: 1, "items.product": 1 }` (sales trend, top products by date), `{ "items.product": 1 }` ("also bought") and `{ user: 1, orderDate: -1 }` (order history, segments).
- **Carts** live in their own `carts` collection, one per user. Adding to the cart checks the product exists and the quantity is a whole number of at least 1.
- **Segments use USD tiers:** Bronze under $500, Silver $500–1,500, Gold $1,500–3,000, Platinum $3,000+. The endpoint also takes the dashboard's `from` / `to`.
- **Real auth everywhere.** Person C's review routes use the JWT `auth` middleware; posting a review needs a login and each user can review a product once (409 otherwise).
- **Removed placeholders** from the feature branches (stub auth, stub User/Product/Order models, dev routes, duplicate seed scripts) in favour of the shared ones.

**Client**
- **One dashboard date filter.** Every panel (sales trend, top products, customer segments) receives the same `from` / `to`; low stock is always current.
- **One design system.** All pages use the same Tailwind look: stone/slate neutrals, one indigo accent, real product photos, no gradients.
- **Shared helpers:** `utils/format.js` (prices, dates, "2 days ago"), `components/Toast.jsx` (`useToast()` for confirmations), `components/Icon.jsx`, `ProductImage` from `components/ProductCard.jsx`, and `useCart()` from `context/CartContext.jsx` (cart items and the navbar badge count).
- **Interactions:** quick add from product cards, cart badge, quantity steppers, expandable order rows, clickable rating bars that filter reviews, star input with keyboard support, hover-linked charts (top products, segments donut and tier list).
- **Product photos** are in `client/public/products/`; sources and licences are in [docs/image-credits.md](docs/image-credits.md).

More detail: [docs/indexing-notes.md](docs/indexing-notes.md) (sales trend and the compound index) and [docs/segments-and-cooccurrence.md](docs/segments-and-cooccurrence.md) (segments and "also bought").

## Team Workflow

- Each member works in their own repo or fork and opens pull requests into the main team repo.
- Do not edit another person's files directly. Shared files (`app.js`, `routes/index.js`, `App.jsx`) should change only by adding one line to register your route or page.
- `analyticsRoutes.js` gets one endpoint from each person; combine them when merging.

## Team

| Member | Role |
|---|---|
| Person A | Auth, Catalog & Sales Trends |
| Person B | Cart, Orders & Top Products |
| Person C | Reviews, Customer Segments & Also Bought |
