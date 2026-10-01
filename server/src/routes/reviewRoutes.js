// Mounted at /api/products/:productId/reviews
const router = require('express').Router({ mergeParams: true });
const { createReview, getReviews, getRatingSummary } = require('../controllers/reviewController');
const auth = require('../middleware/auth'); // real JWT middleware from Person A

router.get('/', getReviews);
router.get('/summary', getRatingSummary);
router.post('/', auth, createReview);

module.exports = router;
