// Product-level routes. Mounted at /api/products
const router = require('express').Router();
const { getAlsoBought } = require('../controllers/alsoBoughtController');

router.get('/:productId/also-bought', getAlsoBought);

module.exports = router;
