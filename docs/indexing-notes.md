# Indexing Notes: Sales Trend Query

*Person A · DBMS Unit 3 (Aggregation and Indexing)*

This note covers the compound index behind the sales-trend dashboard panel: why it exists, how MongoDB uses it, and what it changes, measured before and after.

## 1. The query being optimised

`GET /api/analytics/sales-trend` runs this aggregation pipeline on the `orders` collection (see `server/src/controllers/salesTrendController.js`):

```js
[
  { $match: {
      status: { $ne: 'cancelled' },
      orderDate: { $gte: from, $lte: to },
      'items.product': productId            // only when filtering by one product
  }},
  { $unwind: '$items' },                    // only when filtering by one product
  { $match: { 'items.product': productId } },
  { $group: {
      _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
      revenue: { $sum: '$total' },          // or price * quantity per product
      orders:  { $sum: 1 },
      units:   { $sum: { $sum: '$items.quantity' } }
  }},
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  { $project: { period: 'YYYY-MM', revenue, orders, units } }
]
```

Only the first `$match` stage can use an index. Every stage after it works on whatever documents that stage passes on, so the goal is to make the first `$match` read as few documents as possible.

Orders embed their line items (`items: [{ product, name, price, quantity }]`). There is no separate OrderItems collection, so the plan's "`orderDate + productId`" index becomes an index on `orderDate` and `items.product`.

## 2. The index

```js
db.orders.createIndex({ orderDate: 1, 'items.product': 1 })
// name: orderDate_1_items.product_1
```

The seed script creates it (`npm run seed`).

**It is a multikey index.** `items.product` sits inside an array, so MongoDB stores one index key per line item. An order with 3 items creates 3 keys: `(orderDate, productA)`, `(orderDate, productB)` and `(orderDate, productC)`. That is why "keys examined" can be higher than "docs examined" in the results below.

**Why `orderDate` comes first.** Every dashboard query filters on a date range, but only some filter on a product. With `orderDate` as the leading field, one index serves both kinds of query:

- **Date range only:** the query uses the index prefix `orderDate`.
- **Date range plus product:** the query uses both fields.

## 3. How it was measured

`npm run bench` (`server/scripts/indexBenchmark.js`):

1. **Build a scratch copy.** It copies the seeded orders 50 times into a temporary `orders_benchmark` collection, giving 50,000 documents. With only 1,000 orders every query takes about 1 ms, which is too small to compare. The real `orders` collection is never modified.
2. **Try each index setup.** It runs every query under three setups: no index, the chosen index, and the same two fields in reverse order.
3. **Record the numbers.** For each run it records:
   - from `explain("executionStats")` on the `$match` stage: the plan type (`COLLSCAN` or `IXSCAN`), keys examined, docs examined, and the server time for that stage
   - the average time of the full pipeline over 20 runs, after one warm-up run
4. **Clean up.** It drops the scratch collection.

The two queries are the dashboard's typical requests:

- **Q1: all sales, last 3 months.** A date range only. This is the dashboard's 3M preset.
- **Q2: one product, last 12 months.** A date range plus the best-selling product ("Phone Case").

## 4. Results

Measured on 2026-09-30 against local MongoDB 8.3 with 50,000 orders.

### Q1: sales trend, last 3 months

| Index | Plan | Docs returned | Keys examined | Docs examined | `$match` time (ms) | Full pipeline avg (ms) |
|---|---|---:|---:|---:|---:|---:|
| No index | COLLSCAN | 9,450 | 0 | 50,000 | 63 | 134.3 |
| `{ orderDate: 1, items.product: 1 }` | IXSCAN | 9,450 | 19,800 | 9,650 | 61 | 129.6 |
| `{ items.product: 1, orderDate: 1 }` | COLLSCAN | 9,450 | 0 | 50,000 | 71 | 138.5 |

### Q2: one product, last 12 months

| Index | Plan | Docs returned | Keys examined | Docs examined | `$match` time (ms) | Full pipeline avg (ms) |
|---|---|---:|---:|---:|---:|---:|
| No index | COLLSCAN | 4,500 | 0 | 50,000 | 103 | 150.7 |
| `{ orderDate: 1, items.product: 1 }` | IXSCAN | 4,500 | 5,558 | 4,800 | 40 | 80.3 |
| `{ items.product: 1, orderDate: 1 }` | IXSCAN | 4,500 | 4,800 | 4,800 | 33 | 74.4 |

## 5. What the numbers show

**1. Without an index, every query reads the whole collection.** It examines all 50,000 documents (a COLLSCAN), whether the answer has 4,500 rows or 9,450.

**2. With the index, only the matching orders are read.**
- For Q2, docs examined drop from 50,000 to 4,800 (about 10× fewer). The `$match` stage goes from 103 ms to 40 ms, and the full pipeline from 151 ms to 80 ms, about 1.9× faster.
- The 300 documents read but not returned (4,800 vs 4,500) are cancelled orders. They pass the index bounds, then get dropped by `status: { $ne: 'cancelled' }`, a condition the index doesn't cover.

**3. An index doesn't help much when the query returns a large share of the collection.**
- For Q1, docs examined drop 5× (50,000 to 9,650), yet the time barely moves (134 ms to 130 ms).
- The query still returns about 19% of the collection. Reading those 9,450 documents and grouping them costs about the same as scanning everything.
- The rule: an index pays off when the query is **selective**. For wide date ranges, the fix would be pre-aggregation (for example, a monthly summary collection), not a different index.

**4. Field order matters: equality, then sort, then range (the ESR rule).**
- The reversed index `{ items.product, orderDate }` puts the equality field first. That makes it slightly better for Q2: 4,800 keys instead of 5,558, and 74 ms instead of 80 ms.
  - With the chosen index, the scan walks the whole date range and checks the product inside it, which reads a few extra keys.
  - With the reversed index, it jumps straight to one product and reads only its date range.
- But the reversed index cannot be used by Q1 at all, because Q1 has no product filter and the index's leading field is `items.product`. So Q1 falls back to a COLLSCAN.
- Every dashboard query has a date range, and only some have a product. So `{ orderDate: 1, items.product: 1 }` is the better single index for this workload. It gives up about 6 ms on Q2 to make Q1 indexable.
- If product-level queries became the main workload, adding the reversed index as a second index would be worth considering.

**5. What it costs.**
- Each index adds work to every insert, and because this one is multikey, each order adds one key per line item.
- For a read-heavy dashboard on a collection that only grows by appending new orders, that trade-off is fine.

## 6. Reproducing

```bash
cd server
npm run seed     # 1,000 orders; also creates the index on the real collection
npm run bench    # default 50x scale; try: npm run bench -- --scale 100
```

To inspect the plan yourself in `mongosh`:

```js
use ecommerce
db.orders.find({
  status: { $ne: 'cancelled' },
  orderDate: { $gte: ISODate('2025-10-01') },
  'items.product': db.products.findOne({ name: 'Phone Case' })._id
}).explain('executionStats')
// look for: winningPlan -> IXSCAN, indexName "orderDate_1_items.product_1",
//           isMultiKey: true, and executionStats.totalDocsExamined
```

Timings vary between machines and runs. Keys and docs examined are stable, so compare those first.
