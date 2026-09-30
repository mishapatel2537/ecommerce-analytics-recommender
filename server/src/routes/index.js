const router = require('express').Router();
router.use('/products/:productId/reviews', require('./reviewRoutes'));
module.exports = router;