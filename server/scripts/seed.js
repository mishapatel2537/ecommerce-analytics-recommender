/**
 * Seed script: users, products, orders.
 *
 *   npm run seed
 *
 * Wipes and reloads the users, products and orders collections.
 * Uses a fixed faker seed, so every teammate gets the same data.
 *
 * Logins created:
 *   admin@shop.com / admin123     (admin)
 *   every customer / password123
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

const User = require('../src/models/User');
const Product = require('../src/models/Product');

faker.seed(42);

const NUM_CUSTOMERS = 99; // + 1 admin = 100 users
const NUM_ORDERS = 1000;
const MONTHS_OF_HISTORY = 18;

// ---------- Products (50) ----------

const CATALOG = {
  Electronics: [
    ['Laptop Pro 14"', 1299.99],
    ['Smartphone X', 799.99],
    ['Wireless Earbuds', 129.99],
    ['Wireless Mouse', 29.99],
    ['Mechanical Keyboard', 89.99],
    ['Laptop Sleeve', 24.99],
    ['Phone Case', 19.99],
    ['Fast Charger 30W', 34.99],
    ['4K Monitor 27"', 349.99],
    ['Smartwatch Fit', 199.99],
  ],
  Books: [
    ['Atomic Habits', 16.99],
    ['Deep Work', 14.99],
    ['The Pragmatic Programmer', 39.99],
    ['Clean Code', 34.99],
    ['Sapiens', 18.99],
    ['Thinking, Fast and Slow', 15.99],
    ['Designing Data-Intensive Applications', 44.99],
    ['The Alchemist', 11.99],
  ],
  Clothing: [
    ['Classic Cotton T-Shirt', 14.99],
    ['Slim Fit Jeans', 49.99],
    ['Hooded Sweatshirt', 39.99],
    ['Running Shoes', 89.99],
    ['Sports Socks (3-pack)', 12.99],
    ['Winter Jacket', 129.99],
    ['Baseball Cap', 17.99],
    ['Leather Belt', 24.99],
  ],
  'Home & Kitchen': [
    ['Coffee Maker', 79.99],
    ['Coffee Grinder', 39.99],
    ['French Press', 27.99],
    ['Non-Stick Frying Pan', 34.99],
    ['Chef Knife', 44.99],
    ['Cutting Board', 19.99],
    ['Ceramic Mug Set', 22.99],
    ['Air Fryer', 99.99],
    ['Scented Candle', 14.99],
  ],
  'Sports & Fitness': [
    ['Yoga Mat', 29.99],
    ['Resistance Bands', 19.99],
    ['Water Bottle 1L', 15.99],
    ['Adjustable Dumbbells', 149.99],
    ['Foam Roller', 24.99],
    ['Jump Rope', 9.99],
    ['Gym Bag', 39.99],
    ['Protein Shaker', 11.99],
  ],
  Beauty: [
    ['Shampoo', 12.99],
    ['Conditioner', 12.99],
    ['Face Moisturizer', 24.99],
    ['Sunscreen SPF 50', 17.99],
    ['Lip Balm', 5.99],
    ['Hair Dryer', 59.99],
    ['Perfume', 69.99],
  ],
};

// Products that are often bought together (gives the co-purchase pipeline a signal).
// [main product, companion, chance companion is added when main is in the basket]
const BUNDLES = [
  ['Laptop Pro 14"', 'Laptop Sleeve', 0.55],
  ['Laptop Pro 14"', 'Wireless Mouse', 0.45],
  ['Smartphone X', 'Phone Case', 0.6],
  ['Smartphone X', 'Fast Charger 30W', 0.4],
  ['Coffee Maker', 'Coffee Grinder', 0.45],
  ['French Press', 'Ceramic Mug Set', 0.4],
  ['Yoga Mat', 'Resistance Bands', 0.5],
  ['Adjustable Dumbbells', 'Protein Shaker', 0.4],
  ['Running Shoes', 'Sports Socks (3-pack)', 0.55],
  ['Shampoo', 'Conditioner', 0.65],
  ['Atomic Habits', 'Deep Work', 0.4],
  ['Clean Code', 'The Pragmatic Programmer', 0.45],
];

// A few products start with low stock (for Person B's low-stock query)
const LOW_STOCK = ['4K Monitor 27"', 'Winter Jacket', 'Air Fryer', 'Hair Dryer', 'Designing Data-Intensive Applications'];

// ---------- Helpers ----------

const now = new Date();
const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_OF_HISTORY, 1));
const DAY = 24 * 60 * 60 * 1000;

function monthsBefore(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

// Seasonal multiplier per calendar month (Jan = 0): holiday peak in Nov/Dec
const SEASON = [0.8, 0.75, 0.9, 0.95, 1.0, 0.95, 1.0, 1.05, 1.0, 1.05, 1.5, 1.8];

function dateWeight(date) {
  const progress = (date - historyStart) / (now - historyStart); // 0..1
  const growth = 0.75 + 0.5 * progress; // business grows over time
  return SEASON[date.getUTCMonth()] * growth;
}
const MAX_DATE_WEIGHT = Math.max(...SEASON) * 1.25;

// Rejection sampling: uniform date in [from, now], kept in proportion to its weight
function randomOrderDate(from) {
  for (;;) {
    const date = faker.date.between({ from, to: now });
    if (faker.number.float({ min: 0, max: MAX_DATE_WEIGHT }) <= dateWeight(date)) return date;
  }
}

function orderStatus(date) {
  const ageDays = (now - date) / DAY;
  if (ageDays < 3) return 'pending';
  if (ageDays < 10) return 'shipped';
  return faker.number.float() < 0.05 ? 'cancelled' : 'delivered';
}

const round2 = (n) => Math.round(n * 100) / 100;

// ---------- Main ----------

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`Connected to ${mongoose.connection.name}`);

  // Reviews and carts point at user/product ids that are about to change, so clear them too.
  // Run `npm run seed:reviews` afterwards (or `npm run seed:all`) to regenerate reviews.
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    db.collection('orders').deleteMany({}),
    db.collection('reviews').deleteMany({}),
    db.collection('carts').deleteMany({}),
  ]);
  console.log('Cleared users, products, orders, reviews, carts');

  // Users
  const [adminHash, customerHash] = await Promise.all([bcrypt.hash('admin123', 10), bcrypt.hash('password123', 10)]);

  const users = [
    {
      name: 'Store Admin',
      email: 'admin@shop.com',
      passwordHash: adminHash,
      role: 'admin',
      createdAt: monthsBefore(historyStart, 6),
    },
  ];
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    users.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}.${i + 1}@example.com`.toLowerCase().replace(/[^a-z0-9.@]/g, ''),
      passwordHash: customerHash,
      role: 'customer',
      // ~60% exist before the order history starts; the rest sign up along the way
      createdAt:
        faker.number.float() < 0.6
          ? faker.date.between({ from: monthsBefore(historyStart, 6), to: historyStart })
          : faker.date.between({ from: historyStart, to: monthsBefore(now, 1) }),
    });
  }
  const insertedUsers = await User.insertMany(users, { timestamps: false });
  const customers = insertedUsers.filter((u) => u.role === 'customer');
  console.log(`Inserted ${insertedUsers.length} users (1 admin, ${customers.length} customers)`);

  // Products
  const productDocs = [];
  for (const [category, items] of Object.entries(CATALOG)) {
    for (const [name, price] of items) {
      productDocs.push({
        name,
        category,
        price,
        stock: LOW_STOCK.includes(name) ? faker.number.int({ min: 0, max: 9 }) : faker.number.int({ min: 20, max: 200 }),
        createdAt: monthsBefore(historyStart, 2),
      });
    }
  }
  const products = await Product.insertMany(productDocs, { timestamps: false });
  const byName = new Map(products.map((p) => [p.name, p]));
  console.log(`Inserted ${products.length} products`);

  // Popularity: a handful of best-sellers, a long tail of slow movers
  const productWeights = products.map((p) => ({
    value: p,
    weight: faker.helpers.weightedArrayElement([
      { value: 12, weight: 1 },
      { value: 5, weight: 3 },
      { value: 2, weight: 6 },
    ]),
  }));

  // Customer activity: loyal / regular / occasional buyers
  const customerWeights = customers.map((u) => ({
    value: u,
    weight: faker.helpers.weightedArrayElement([
      { value: 8, weight: 15 },
      { value: 3, weight: 35 },
      { value: 1, weight: 50 },
    ]),
  }));

  // Orders
  const orders = [];
  for (let i = 0; i < NUM_ORDERS; i++) {
    // Pick the date first (seasonal curve), then a customer who had signed up by then
    const orderDate = randomOrderDate(historyStart);
    const user = faker.helpers.weightedArrayElement(customerWeights.filter((c) => c.value.createdAt <= orderDate));

    const itemCount = faker.helpers.weightedArrayElement([
      { value: 1, weight: 45 },
      { value: 2, weight: 30 },
      { value: 3, weight: 17 },
      { value: 4, weight: 8 },
    ]);

    const basket = new Map(); // productId -> product (no duplicate lines)
    while (basket.size < itemCount) {
      const p = faker.helpers.weightedArrayElement(productWeights);
      basket.set(p._id.toString(), p);
    }
    // Add bundle companions
    for (const [main, companion, chance] of BUNDLES) {
      if (basket.has(byName.get(main)._id.toString()) && faker.number.float() < chance) {
        const c = byName.get(companion);
        basket.set(c._id.toString(), c);
      }
    }

    const items = [...basket.values()].map((p) => ({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: faker.helpers.weightedArrayElement([
        { value: 1, weight: 70 },
        { value: 2, weight: 22 },
        { value: 3, weight: 8 },
      ]),
    }));

    orders.push({
      user: user._id,
      items,
      total: round2(items.reduce((sum, it) => sum + it.price * it.quantity, 0)),
      orderDate,
      status: orderStatus(orderDate),
    });
  }
  orders.sort((a, b) => a.orderDate - b.orderDate);
  await db.collection('orders').insertMany(orders);
  console.log(`Inserted ${orders.length} orders from ${historyStart.toISOString().slice(0, 10)} to today`);

  // Indexes
  await Promise.all([User.syncIndexes(), Product.syncIndexes()]);
  // Compound index for the sales-trend queries (see scripts/indexBenchmark.js)
  await db.collection('orders').createIndex({ orderDate: 1, 'items.product': 1 });
  console.log('Indexes ready');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
