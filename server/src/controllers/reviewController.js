const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/products/:productId/reviews
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) return res.status(400).json({ message: 'Invalid product id' });

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) return res.status(404).json({ message: 'Product not found' });

    const { rating, comment } = req.body;
    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment,
    });
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already reviewed this product' });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/products/:productId/reviews
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) return res.status(400).json({ message: 'Invalid product id' });

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:productId/reviews/summary
// Aggregations: average rating + review count, and the count per star rating
exports.getRatingSummary = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isValidId(productId)) return res.status(400).json({ message: 'Invalid product id' });

    const pid = new mongoose.Types.ObjectId(productId);
    const [[summary], byRating] = await Promise.all([
      Review.aggregate([
        { $match: { product: pid } },
        { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { product: pid } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    byRating.forEach((r) => {
      distribution[r._id] = r.count;
    });

    res.json({
      avgRating: summary ? Math.round(summary.avgRating * 10) / 10 : 0,
      count: summary ? summary.count : 0,
      distribution,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
