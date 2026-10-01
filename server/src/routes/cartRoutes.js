const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // from Person A
const { getCart, addToCart, updateQuantity, removeItem } = require('../controllers/cartController');

router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/:productId', auth, updateQuantity);
router.delete('/:productId', auth, removeItem);

module.exports = router;