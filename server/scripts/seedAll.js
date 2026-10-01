// Seeds users, products and orders. WARNING: wipes users, products, orders
// and reviews in the database from MONGO_URI. Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Review = require('../src/models/Review');

// Small seeded PRNG so every run produces the same data
function makeRng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = makeRng(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const NUM_USERS = 40;
const NUM_ORDERS = 300;

const PRODUCTS = [
  ['Wireless Earbuds', 'Electronics', 1999], ['Phone Charger', 'Electronics', 799],
  ['USB-C Cable', 'Electronics', 299], ['Power Bank', 'Electronics', 1499],
  ['Bluetooth Speaker', 'Electronics', 2499], ['Phone Case', 'Electronics', 499],
  ['Screen Protector', 'Electronics', 249], ['Smartwatch', 'Electronics', 2999],
  ['Desk Lamp', 'Home', 899], ['Water Bottle', 'Home', 399],
  ['Coffee Mug', 'Home', 249], ['Cushion Cover', 'Home', 349],
  ['Wall Clock', 'Home', 649], ['Storage Box', 'Home', 549],
  ['Cotton T-Shirt', 'Fashion', 599], ['Denim Jeans', 'Fashion', 1799],
  ['Running Shoes', 'Fashion', 2499], ['Backpack', 'Fashion', 1299],
  ['Sunglasses', 'Fashion', 899], ['Cap', 'Fashion', 349],
  ['Notebook Pack', 'Stationery', 299], ['Gel Pen Set', 'Stationery', 199],
  ['Novel Bestseller', 'Stationery', 399], ['Desk Organizer', 'Stationery', 499],
  ['Sticky Notes', 'Stationery', 149], ['Yoga Mat', 'Fitness', 999],
  ['Resistance Bands', 'Fitness', 599], ['Skipping Rope', 'Fitness', 249],
  ['Dumbbell Set', 'Fitness', 2499], ['Gym Towel', 'Fitness', 299],
];

// Products that are often bought together (gives also-bought a clear signal)
const PAIRS = [
  ['Phone Case', 'Screen Protector'],
  ['Wireless Earbuds', 'Phone Charger'],
  ['Notebook Pack', 'Gel Pen Set'],
  ['Yoga Mat', 'Resistance Bands'],
  ['Running Shoes', 'Gym Towel'],
  ['Coffee Mug', 'Desk Lamp'],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), Review.deleteMany({})]);

  // Users (first one is an admin)
  const users = await User.insertMany(
    Array.from({ length: NUM_USERS }, (_, i) => ({
      name: i === 0 ? 'Admin User' : `Customer ${String(i).padStart(2, '0')}`,
      email: i === 0 ? 'admin@example.com' : `customer${i}@example.com`,
      role: i === 0 ? 'admin' : 'customer',
    }))
  );
  const customers = users.slice(1);

  // Products
  const products = await Product.insertMany(
    PRODUCTS.map(([name, category, price]) => ({ name, category, price, stock: 100 }))
  );
  const byName = new Map(products.map((p) => [p.name, p]));

  // Skewed customer weights: a few heavy buyers, many light ones (Zipf-like)
  const weights = customers.map((_, i) => 1 / Math.pow(i + 1, 1.1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const pickCustomer = () => {
    let r = rand() * totalWeight;
    for (let i = 0; i < customers.length; i++) {
      r -= weights[i];
      if (r <= 0) return customers[i];
    }
    return customers[customers.length - 1];
  };

  const now = Date.now();
  const orders = [];
  for (let n = 0; n < NUM_ORDERS; n++) {
    const customer = pickCustomer();
    const chosen = new Map(); // productId -> product (keeps items distinct)
    const size = 1 + Math.floor(rand() * 4); // 1 to 4 items
    while (chosen.size < size) {
      const p = pick(products);
      chosen.set(String(p._id), p);
    }
    // Correlated partner: 60% chance to add the partner of a paired product
    for (const p of [...chosen.values()]) {
      for (const [a, b] of PAIRS) {
        const partnerName = p.name === a ? b : p.name === b ? a : null;
        if (partnerName && rand() < 0.6) {
          const partner = byName.get(partnerName);
          chosen.set(String(partner._id), partner);
        }
      }
    }
    const items = [...chosen.values()].map((p) => ({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: rand() < 0.8 ? 1 : 2,
    }));
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    orders.push({
      user: customer._id,
      items,
      total,
      orderDate: new Date(now - Math.floor(rand() * 365) * 24 * 3600 * 1000),
      status: 'delivered',
    });
  }
  await Order.insertMany(orders);

  console.log(`Seeded ${users.length} users, ${products.length} products, ${orders.length} orders.`);
  console.log('Next: npm run seed:reviews');
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
