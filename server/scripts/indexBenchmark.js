/**
 * Before/after timing for the sales-trend compound index.
 *
 *   npm run bench              (default: 50x the seeded orders)
 *   npm run bench -- --scale 100
 *
 * Copies `orders` into a scratch collection `orders_benchmark` (scaled up so
 * timings are measurable), then runs the sales-trend queries under three index
 * setups:
 *   1. no index                      -> COLLSCAN
 *   2. { orderDate, items.product }  -> the index used by the app
 *   3. { items.product, orderDate }  -> same fields, equality-first order (ESR rule)
 *
 * The real `orders` collection and its indexes are never modified.
 * The scratch collection is dropped at the end.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { buildSalesTrendPipeline } = require('../src/controllers/salesTrendController');

const BENCH_COLLECTION = 'orders_benchmark';
const RUNS = 20;

const scaleArg = process.argv.indexOf('--scale');
const SCALE = scaleArg > -1 ? Number(process.argv[scaleArg + 1]) : 50;

const INDEX_SETUPS = [
  { label: 'No index', key: null },
  { label: '{ orderDate: 1, items.product: 1 }', key: { orderDate: 1, 'items.product': 1 } },
  { label: '{ items.product: 1, orderDate: 1 }', key: { 'items.product': 1, orderDate: 1 } },
];

function monthsAgo(n) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

// Collect every "stage" name in an explain plan tree (works for classic and SBE plans)
function planStages(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (typeof node.stage === 'string') out.push(node.stage);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((v) => planStages(v, out));
    else if (typeof value === 'object') planStages(value, out);
  }
  return out;
}

async function buildBenchCollection(db) {
  await db.collection(BENCH_COLLECTION).drop().catch(() => {});
  const source = await db.collection('orders').find({}, { projection: { _id: 0 } }).toArray();
  if (source.length === 0) throw new Error('No orders found. Run `npm run seed` first.');

  const bench = db.collection(BENCH_COLLECTION);
  for (let i = 0; i < SCALE; i++) {
    await bench.insertMany(source.map((o) => ({ ...o })), { ordered: false });
  }
  return bench;
}

async function measure(coll, query) {
  // Planner view of the $match stage (what the index affects)
  const explain = await coll.find(query.match).explain('executionStats');
  const stats = explain.executionStats;
  const stages = planStages(explain.queryPlanner.winningPlan);
  const scan = stages.includes('IXSCAN') ? 'IXSCAN' : stages.includes('COLLSCAN') ? 'COLLSCAN' : stages[0];

  // Wall-clock time of the full aggregation, averaged
  await coll.aggregate(query.pipeline).toArray(); // warm-up
  const start = process.hrtime.bigint();
  for (let i = 0; i < RUNS; i++) await coll.aggregate(query.pipeline).toArray();
  const avgMs = Number(process.hrtime.bigint() - start) / 1e6 / RUNS;

  return {
    scan,
    returned: stats.nReturned,
    keysExamined: stats.totalKeysExamined,
    docsExamined: stats.totalDocsExamined,
    matchMs: stats.executionTimeMillis,
    avgMs: avgMs.toFixed(2),
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // Use the best-selling product so the product-filtered query has real work to do
  const [top] = await db
    .collection('orders')
    .aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 1 }])
    .toArray();

  const threeMonthsAgo = monthsAgo(3);
  const twelveMonthsAgo = monthsAgo(12);

  const queries = [
    {
      name: 'Q1: sales trend, last 3 months',
      args: { from: threeMonthsAgo },
    },
    {
      name: `Q2: sales trend for "${top.name}", last 12 months`,
      args: { from: twelveMonthsAgo, productId: top._id },
    },
  ].map((q) => {
    const pipeline = buildSalesTrendPipeline(q.args);
    return { ...q, pipeline, match: pipeline[0].$match };
  });

  console.log(`Building ${BENCH_COLLECTION} (${SCALE}x seeded orders)...`);
  const bench = await buildBenchCollection(db);
  const total = await bench.estimatedDocumentCount();
  console.log(`${total} documents. Each timing is the average of ${RUNS} runs.\n`);

  const results = [];
  for (const setup of INDEX_SETUPS) {
    await bench.dropIndexes();
    if (setup.key) await bench.createIndex(setup.key);

    for (const q of queries) {
      const r = await measure(bench, q);
      results.push({ query: q.name, index: setup.label, ...r });
    }
  }

  await bench.drop();
  await mongoose.disconnect();

  // Print grouped by query, as a markdown table (paste into docs/indexing-notes.md)
  for (const q of queries) {
    console.log(`### ${q.name}\n`);
    console.log('| Index | Plan | Docs returned | Keys examined | Docs examined | $match time (ms) | Full pipeline avg (ms) |');
    console.log('|---|---|---:|---:|---:|---:|---:|');
    for (const r of results.filter((x) => x.query === q.name)) {
      console.log(
        `| ${r.index} | ${r.scan} | ${r.returned} | ${r.keysExamined} | ${r.docsExamined} | ${r.matchMs} | ${r.avgMs} |`
      );
    }
    console.log('');
  }
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
