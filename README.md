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
| GET/POST/PUT/DELETE | `/api/products` | A |
| GET | `/api/analytics/sales-trend` | A |
| GET/POST | `/api/cart`, `/api/orders` | B |
| GET | `/api/analytics/top-products` | B |
| GET/POST | `/api/products/:id/reviews` | C |
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

```bash
# Server
cd server
cp .env.example .env       # set MONGO_URI and JWT_SECRET
npm install
npm run seed               # load sample data
npm run dev

# Client
cd client
npm install
npm run dev
```

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
