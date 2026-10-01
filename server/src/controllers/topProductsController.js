const Order = require('../models/Order');
const Product = require('../models/Product'); // from Person A

// Best-selling products (the aggregation pipeline for your DBMS report)
// GET /api/analytics/top-products?sortBy=quantity|revenue&limit=5&from=&to=
exports.getTopProducts = async (req, res) => {
  try {
    const { sortBy = 'quantity', from, to } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

    const match = { status: { $ne: 'cancelled' } };
    if (from || to) {
      match.orderDate = {};
      if (from) match.orderDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setUTCHours(23, 59, 59, 999); // include the whole "to" day
        match.orderDate.$lte = end;
      }
    }

    const sortField = sortBy === 'revenue' ? 'totalRevenue' : 'totalQuantity';

    const result = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { [sortField]: -1, _id: 1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: 1,
          category: { $first: '$product.category' },
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orders: 1,
        },
      },
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
