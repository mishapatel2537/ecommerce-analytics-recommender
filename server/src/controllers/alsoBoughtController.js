const mongoose = require('mongoose');
const Order = require('../models/Order');

// Reusable so the explain() script runs the exact same pipeline.
function buildAlsoBoughtPipeline(productId, limit = 5) {
  const pid = new mongoose.Types.ObjectId(productId);
  return [
    { $match: { 'items.product': pid } }, // orders containing this product
    // distinct products per order (a product listed twice counts once)
    { $project: { products: { $setUnion: ['$items.product', []] } } },
    { $unwind: '$products' }, // one document per product in the order
    { $match: { products: { $ne: pid } } }, // drop the product itself
    { $group: { _id: '$products', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        price: '$product.price',
        category: '$product.category',
        count: 1,
      },
    },
  ];
}

// GET /api/products/:productId/also-bought?limit=5
exports.getAlsoBought = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const results = await Order.aggregate(buildAlsoBoughtPipeline(productId, limit));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.buildAlsoBoughtPipeline = buildAlsoBoughtPipeline;
