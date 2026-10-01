const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { getTopProducts, getLowStock } = require('../controllers/topProductsController');

router.get('/top-products', auth, requireAdmin, getTopProducts);
router.get('/low-stock', auth, requireAdmin, getLowStock);

module.exports = router;

//check the code!