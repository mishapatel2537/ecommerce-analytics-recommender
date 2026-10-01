const router = require('express').Router();

router.use('/products/:productId/reviews', require('./reviewRoutes'));
router.use('/products', require('./productExtraRoutes')); // /:productId/also-bought
router.use('/analytics', require('./analyticsRoutes'));

if (process.env.NODE_ENV !== 'production') {
  router.use('/dev', require('./devRoutes'));
}

module.exports = router;
