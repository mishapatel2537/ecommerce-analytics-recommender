// Development helpers (user and product lists for the sign-in menu and product picker). Not mounted in production.
const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');

router.get('/users', async (req, res) => {
  res.json(await User.find({}, 'name role').sort({ name: 1 }).limit(100));
});

router.get('/products', async (req, res) => {
  res.json(await Product.find({}, 'name price category').sort({ name: 1 }));
});

module.exports = router;
