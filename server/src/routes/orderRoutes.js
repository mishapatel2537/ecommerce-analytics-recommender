const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // from Person A
const { checkout, getMyOrders } = require('../controllers/orderController');

router.post('/checkout', auth, checkout);
router.get('/', auth, getMyOrders);

module.exports = router;