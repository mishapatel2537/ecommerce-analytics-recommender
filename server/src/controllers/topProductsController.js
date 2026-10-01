const Order = require('../models/Order');
const Product = require('../models/Product'); // from Person A

// Best-selling products (the aggregation pipeline for your DBMS report)
exports.getTopProducts = async (req, res) => {
  try {
    const { sortBy = 'quantity', limit = 5, from, to } = req.query;

    const match = { status: { $ne: 'cancelled' } };
    if (from || to) {
      match.orderDate = {};
      if (from) match.orderDate.$gte = new Date(from);
      if (to) match.orderDate.$lte = new Date(to);
    }

    const sortField = sortBy === 'revenue' ? 'totalRevenue' : 'totalQuantity';

    const result = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { [sortField]: -1 } },
      { $limit: Number(limit) },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Products running low on stock
exports.getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lte: threshold } })
      .select('name category stock')
      .sort({ stock: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};