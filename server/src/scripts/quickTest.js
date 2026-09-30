require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.create({ name: 'Test User', email: 'test@example.com' });
  const product = await Product.create({ name: 'Test Product', price: 499 });
  console.log('USER_ID   =', user._id.toString());
  console.log('PRODUCT_ID=', product._id.toString());
  await mongoose.disconnect();
})();