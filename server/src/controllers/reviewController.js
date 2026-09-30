const mongoose = require('mongoose');
const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id, // set by A's auth middleware
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

exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
};

// Aggregation: average rating + review count for one product
exports.getRatingSummary = async (req, res) => {
  const [summary] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(req.params.productId) } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  res.json({
    avgRating: summary ? Math.round(summary.avgRating * 10) / 10 : 0,
    count: summary ? summary.count : 0,
  });
};