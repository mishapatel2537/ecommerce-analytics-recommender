// Adds 200 extra random orders on top of the main seed (for testing top products).
//   npm run seed:orders
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User'); // from Person A
const Product = require('../src/models/Product'); // from Person A
const Order = require('../src/models/Order');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({ role: 'customer' });
  const products = await Product.find();
  if (!users.length || !products.length) {
    console.log("No users or products found. Run Person A's seed script first.");
    process.exit(1);
  }

  const orders = [];
  for (let i = 0; i < 200; i++) {
    const user = users[randInt(0, users.length - 1)];
    const picked = [...products].sort(() => 0.5 - Math.random()).slice(0, randInt(1, 4));
    const items = picked.map((p) => ({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: randInt(1, 3),
    }));
    const total = Math.round(items.reduce((sum, it) => sum + it.price * it.quantity, 0) * 100) / 100;
    const orderDate = new Date(Date.now() - randInt(0, 180) * 24 * 60 * 60 * 1000);
    orders.push({ user: user._id, items, total, status: 'delivered', orderDate });
  }

  await Order.insertMany(orders);
  console.log(`Inserted ${orders.length} extra orders`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
