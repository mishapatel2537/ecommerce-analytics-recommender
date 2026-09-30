const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { getSalesTrend } = require('../controllers/salesTrendController');

const router = express.Router();

// All analytics endpoints are admin-only
router.use(auth, requireAdmin);

// Person A
router.get('/sales-trend', getSalesTrend);
// Person B: router.get('/top-products', getTopProducts);
// Person C: router.get('/segments', getSegments);

module.exports = router;
