const router = require('express').Router({ mergeParams: true });
const { createReview, getReviews, getRatingSummary } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/', getReviews);
router.get('/summary', getRatingSummary);
router.post('/', protect, createReview);

module.exports = router;
