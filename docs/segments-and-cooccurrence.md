# Reviews, Customer Segments & "Also Bought"

> **Note on the merged app.** This is Person C's write-up from the `misha` branch. In the merged project:
> - Reviews use the real JWT login instead of the `x-test-user-id` stub.
> - The shared seed (`npm run seed:all`) replaces `seedAll.js`.
> - Money is in USD, so the spend tiers are **$500 / $1,500 / $3,000**.
>
> The pipelines and indexes described below are unchanged. See "Integration Notes" in the main README.


Detailed documentation of Person C's share of the **E-commerce Analytics + Recommendation Dashboard** (MERN, Web Dev + Advanced DBMS mini project).

**Theme:** customer feedback and customer insight. Ratings and reviews, spend-tier customer segmentation, and co-purchase recommendations, all powered by MongoDB aggregation pipelines.

**Estimated effort:** about 15 hours (roughly 5 hrs each on database, backend, frontend).

---

## 1. What Person C Delivers

| Area | Deliverable |
|---|---|
| Database | Review schema and indexes; average-rating pipeline; spend-tier segment pipeline (`$bucket`); co-purchase pipeline (`$unwind` + `$lookup`) |
| Backend | Review endpoints; `GET /analytics/segments`; `GET /products/:id/also-bought` |
| Frontend | Star rating and review UI; segments chart on the admin dashboard; "Customers also bought" strip on the product page |
| Docs | Pipeline explanations and index notes for the DBMS report |

## 2. DBMS Concepts Covered

| Concept | Where |
|---|---|
| Aggregation (`$match`, `$group`, `$sort`, `$limit`, `$project`) | All three pipelines |
| `$bucket` (range-based grouping) | Customer spend-tier segments |
| `$unwind` (array flattening) | Co-purchase pipeline |
| `$lookup` (join) | Co-purchase pipeline, product details |
| Unique compound index | One review per user per product |
| Multikey index | `items.product` on Orders for the co-purchase pipeline |
| `explain()` before/after | Performance evidence for the report |

---

## 3. Database

### 3.1 Review schema

```js
// server/src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per product; also serves per-product lookups
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
```

### 3.2 Pipeline 1: Average rating per product

Returns the mean rating and number of reviews for one product.

```js
Review.aggregate([
  { $match: { product: new mongoose.Types.ObjectId(productId) } },
  { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
]);
```

| Stage | Purpose |
|---|---|
| `$match` | Keep only this product's reviews (uses the compound index prefix on `product`) |
| `$group` | Compute `$avg` of rating and `$sum` of 1 for the count |

### 3.3 Pipeline 2: Customer spend-tier segments

Groups orders by customer to get total spend, then buckets customers into tiers.

```js
Order.aggregate([
  { $group: { _id: '$user', totalSpend: { $sum: '$total' }, orderCount: { $sum: 1 } } },
  {
    $bucket: {
      groupBy: '$totalSpend',
      boundaries: [0, 1000, 5000, 15000],
      default: '15000+',
      output: {
        customers: { $sum: 1 },
        avgSpend: { $avg: '$totalSpend' },
        totalRevenue: { $sum: '$totalSpend' },
      },
    },
  },
]);
```

Tier labels are applied in the controller:

| Bucket `_id` | Tier |
|---|---|
| `0` | Bronze |
| `1000` | Silver |
| `5000` | Gold |
| `'15000+'` | Platinum |

**Note:** adjust `boundaries` after looking at the seeded data so each tier has a reasonable number of customers. Check the spread of `totalSpend` first, for example with a quick `$group` + `$sort`.

### 3.4 Pipeline 3: "Customers also bought" (co-purchase)

For a given product, finds the products most often appearing in the same orders.

```js
Order.aggregate([
  { $match: { 'items.product': productId } },          // orders containing this product
  { $unwind: '$items' },                                // one document per line item
  { $match: { 'items.product': { $ne: productId } } },  // drop the product itself
  { $group: { _id: '$items.product', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 },
  { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
  { $unwind: '$product' },
  {
    $project: {
      _id: 0,
      productId: '$_id',
      name: '$product.name',
      price: '$product.price',
      category: '$product.category',
      count: 1,
    },
  },
]);
```

| Stage | Purpose |
|---|---|
| `$match` (first) | Narrow to orders that include the target product |
| `$unwind` | Flatten `items` so each line item is its own document |
| `$match` (second) | Exclude the target product from its own recommendations |
| `$group` | Count how many of those orders each other product appears in |
| `$sort` + `$limit` | Keep the top 5 |
| `$lookup` + `$unwind` | Join product details from the `products` collection |
| `$project` | Shape the response |

**Remember:** `productId` must be cast to an ObjectId (`new mongoose.Types.ObjectId(id)`) because aggregation does not auto-cast like `find()` does.

**Edge case:** if the same product appears twice in one order, it is counted twice. The seed script should give each order distinct products, or dedupe with a `$group` by `(order, product)` before the final count.

### 3.5 Indexes

| Collection | Index | Why | Owner |
|---|---|---|---|
| reviews | `{ product: 1, user: 1 }` unique | Prevent duplicate reviews; fast per-product queries | C |
| orders | `{ 'items.product': 1 }` (multikey) | Speeds up the first `$match` of the co-purchase pipeline | Ask B/A to add it to the Order model |

**For the DBMS report:** run the co-purchase pipeline with `.explain('executionStats')` **before and after** adding the multikey index, and record `totalDocsExamined`, `executionTimeMillis`, and the stage (`COLLSCAN` vs `IXSCAN`).

---

## 4. Backend

### 4.1 Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/products/:productId/reviews` | Customer | Create a review |
| GET | `/api/products/:productId/reviews` | Public | List reviews for a product |
| GET | `/api/products/:productId/reviews/summary` | Public | Average rating and review count |
| GET | `/api/analytics/segments` | Admin | Customer counts and spend per tier |
| GET | `/api/products/:productId/also-bought` | Public | Top co-purchased products |

### 4.2 Request and response examples

**POST `/api/products/:productId/reviews`**
```json
// Request body
{ "rating": 4, "comment": "Great quality for the price." }

// 201 Created
{ "_id": "...", "product": "...", "user": "...", "rating": 4, "comment": "Great quality for the price.", "createdAt": "..." }

// 409 Conflict (already reviewed)
{ "message": "You already reviewed this product" }
```

**GET `/api/products/:productId/reviews/summary`**
```json
{ "avgRating": 4.3, "count": 27 }
```

**GET `/api/analytics/segments`**
```json
[
  { "tier": "Bronze",   "customers": 42, "avgSpend": 540,   "totalRevenue": 22680 },
  { "tier": "Silver",   "customers": 31, "avgSpend": 2800,  "totalRevenue": 86800 },
  { "tier": "Gold",     "customers": 19, "avgSpend": 9100,  "totalRevenue": 172900 },
  { "tier": "Platinum", "customers": 8,  "avgSpend": 21000, "totalRevenue": 168000 }
]
```

**GET `/api/products/:productId/also-bought`**
```json
[
  { "productId": "...", "name": "USB-C Cable", "price": 299, "category": "Accessories", "count": 14 },
  { "productId": "...", "name": "Phone Case",  "price": 499, "category": "Accessories", "count": 11 }
]
```

### 4.3 Files

```
server/src/
├── models/
│   └── Review.js
├── controllers/
│   ├── reviewController.js        # createReview, getReviews, getRatingSummary
│   ├── segmentsController.js      # $bucket pipeline + tier labels
│   └── alsoBoughtController.js    # co-purchase pipeline
├── routes/
│   ├── reviewRoutes.js            # mounted at /products/:productId/reviews
│   ├── productExtraRoutes.js      # GET /products/:productId/also-bought
│   └── analyticsRoutes.js         # adds GET /analytics/segments
scripts/
└── seedReviews.js
```

### 4.4 Dependencies on teammates

| Needs from | What | Workaround until ready |
|---|---|---|
| A | `protect` and `requireAdmin` middleware | Temporary stub that reads a fake user id from a header |
| A | Users and Products collections, seed script | Insert a few test documents manually |
| B | Order schema and order data | Use the seed orders; agree on the schema up front |

### 4.5 Seed script for reviews

`scripts/seedReviews.js` should generate realistic ratings tied to actual purchases:

- For each order item, with about 40% probability, create a review from the ordering user.
- Rating distribution skewed positive (for example 5: 35%, 4: 35%, 3: 15%, 2: 10%, 1: 5%).
- Skip duplicate `(product, user)` pairs to respect the unique index.
- Use `insertMany` with `ordered: false` so duplicates do not abort the run.

---

## 5. Frontend

### 5.1 Components

| Component | Description |
|---|---|
| `StarRating.jsx` | Dual mode: read-only display (supports halves, e.g. 4.3) and interactive input (click to set 1 to 5) |
| `ReviewForm.jsx` | Star input, comment textarea, submit; shows an error on 409 ("already reviewed"); visible only to logged-in customers |
| `ReviewList.jsx` | Reviews with reviewer name, stars, comment, and date; newest first |
| `AlsoBoughtStrip.jsx` | Horizontal row of up to 5 product cards from `/also-bought`; each links to its product page; hidden if the list is empty |
| `SegmentsChart.jsx` | Recharts pie or bar chart of customers per tier, with a tooltip showing average spend and revenue |

### 5.2 Where they plug in

| Component | Page | Note |
|---|---|---|
| `StarRating` (display), `ReviewList`, `ReviewForm` | `ProductDetail.jsx` (B's page) | Agree on a `<ReviewSection productId={id} />` slot at the bottom |
| `AlsoBoughtStrip` | `ProductDetail.jsx` | Below the reviews, or just under the product info |
| `StarRating` (display) | `ProductCard.jsx` (A's component) | Optional: average rating on listing cards |
| `SegmentsChart` | `AdminDashboard.jsx` (A's shell) | Rendered as one panel next to A's and B's charts |

### 5.3 Chart example

```jsx
// components/SegmentsChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#cd7f32', '#a8a9ad', '#d4af37', '#6a5acd'];

export default function SegmentsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="customers" nameKey="tier" outerRadius={100} label>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 5.4 UI states to handle

- Loading and empty states ("No reviews yet. Be the first!")
- Not logged in: replace the review form with a "Log in to review" prompt
- Duplicate review error message
- Failed fetches: show a message instead of a blank strip or chart

---

## 6. Testing Checklist

**Reviews**
- [ ] Create a review, then GET it back
- [ ] Rating below 1 or above 5 is rejected (400)
- [ ] Second review by the same user on the same product returns 409
- [ ] Unauthenticated POST is rejected (401)
- [ ] Summary returns `{ avgRating: 0, count: 0 }` for a product with no reviews
- [ ] Summary average matches a manual calculation on a few reviews

**Segments**
- [ ] Tier counts add up to the number of customers with at least one order
- [ ] A customer sitting exactly on a boundary lands in the higher tier
- [ ] Non-admin request is rejected (403)

**Also bought**
- [ ] The queried product never appears in its own results
- [ ] Results are sorted by count, descending
- [ ] Product with no co-purchases returns `[]`
- [ ] Invalid product id returns 400, not a server crash

---

## 7. Time Plan (about 15 hrs)

| Task | Hrs |
|---|---|
| Review schema, routes, controller, rating pipeline | 2 |
| Seed reviews script | 1 |
| Segments pipeline, tier labels, endpoint | 2 |
| Co-purchase pipeline, endpoint, multikey index and `explain()` comparison | 3 |
| `StarRating`, `ReviewForm`, `ReviewList` | 3 |
| `AlsoBoughtStrip` and `SegmentsChart` | 2 |
| Integration into A's and B's pages, testing | 1.5 |
| Report write-up (pipeline explanations, index notes) | 0.5 to 1 |

---

## 8. Report Contribution (DBMS)

Write one short section per pipeline covering:

1. **Purpose:** the business question it answers
2. **Pipeline:** the code, with one line per stage explaining it
3. **Sample output:** a screenshot from Postman or the dashboard
4. **Performance:** the `explain()` before/after table for the co-purchase pipeline

---

## 9. Optional Advanced Extension (Node only)

If time permits, add data mining on top, all in plain Node scripts under `server/scripts/`:

| Feature | Approach | Output collection |
|---|---|---|
| Association rules | Count support and confidence for product pairs across orders, then keep rules above a threshold | `associationRules` |
| Model-based segments | RFM features per customer, then k-means (for example the `ml-kmeans` package) | `customerClusters` |
| Collaborative filtering | User-item purchase matrix, cosine similarity in plain JS, top-N per user | `similarityScores` |

Run everything from `node scripts/mine.js`, and have the API read the precomputed results. Expose `GET /api/recommendations/:userId` for the collaborative-filtering output.

---

## 10. Definition of Done

- [ ] All five endpoints work and are documented in the Postman collection or README
- [ ] All three pipelines return correct results on seeded data
- [ ] Multikey index added, with before/after `explain()` results saved
- [ ] Review UI, also-bought strip, and segments chart are integrated into the shared pages
- [ ] UI handles loading, empty, and error states
- [ ] Testing checklist completed
- [ ] Report section written
- [ ] Changes merged into the main team repo through a pull request
