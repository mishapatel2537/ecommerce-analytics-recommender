// Analytics endpoints (admin only). More are added here as they are built.
const router = require('express').Router();
const { getSegments } = require('../controllers/segmentsController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/segments', protect, requireAdmin, getSegments);

module.exports = router;
