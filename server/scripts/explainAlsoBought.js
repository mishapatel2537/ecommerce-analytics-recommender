// Runs the co-purchase pipeline with explain('executionStats') WITHOUT and
// WITH the multikey index on items.product. Copy the table into your report.
//   npm run explain
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const { buildAlsoBoughtPipeline } = require('../src/controllers/alsoBoughtController');

const INDEX_KEY = { 'items.product': 1 };

// Find the first value stored under `key` anywhere in the explain output
function findFirst(obj, key) {
  if (obj && typeof obj === 'object') {
    if (key in obj) return obj[key];
    for (const v of Object.values(obj)) {
      const found = findFirst(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

async function measure(label, pipeline) {
  const explain = await Order.collection.aggregate(pipeline).explain('executionStats');
  const text = JSON.stringify(explain);
  return {
    run: label,
    scan: text.includes('IXSCAN') ? 'IXSCAN' : text.includes('COLLSCAN') ? 'COLLSCAN' : '?',
    docsExamined: findFirst(explain, 'totalDocsExamined'),
    keysExamined: findFirst(explain, 'totalKeysExamined'),
    timeMs: findFirst(explain, 'executionTimeMillis'),
  };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const product = (await Product.findOne({ name: 'Phone Case' })) || (await Product.findOne());
  if (!product) throw new Error('No products found. Run npm run seed first.');
  console.log(`Target product: ${product.name} (${product._id})`);
  console.log(`Orders in collection: ${await Order.countDocuments()}\n`);

  const pipeline = buildAlsoBoughtPipeline(product._id, 5);

  // Drop the index if present, so the first run is a full collection scan
  try {
    await Order.collection.dropIndex('items.product_1');
  } catch (e) {
    /* index did not exist */
  }
  const before = await measure('WITHOUT index', pipeline);

  await Order.collection.createIndex(INDEX_KEY);
  const after = await measure('WITH index', pipeline);

  console.table([before, after]);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
