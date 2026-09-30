const mongoose = require('mongoose');

/**
 * Sales-by-month aggregation over the `orders` collection.
 *
 * Orders are read through the raw collection because the Order model
 * belongs to Person B; documents follow the shared Order shape in the README.
 *
 * - Without productId: one row per month from each order's `total`.
 * - With productId: $unwind items and sum only that product's line revenue.
 */
function buildSalesTrendPipeline({ from, to, productId } = {}) {
  const match = { status: { $ne: 'cancelled' } };
  if (from || to) {
    match.orderDate = {};
    if (from) match.orderDate.$gte = from;
    if (to) match.orderDate.$lte = to;
  }

  const pipeline = [];

  if (productId) {
    match['items.product'] = productId;
    pipeline.push(
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      {
        $group: {
          _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 },
          units: { $sum: '$items.quantity' },
        },
      }
    );
  } else {
    pipeline.push(
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          units: { $sum: { $sum: '$items.quantity' } },
        },
      }
    );
  }

  pipeline.push(
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        // "2026-03"
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
            { $toString: '$_id.month' },
          ],
        },
        revenue: { $round: ['$revenue', 2] },
        orders: 1,
        units: 1,
      },
    }
  );

  return pipeline;
}

function parseDate(value, name) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`Invalid ${name} date: ${value}`);
    err.status = 400;
    throw err;
  }
  return date;
}

// GET /api/analytics/sales-trend?from=YYYY-MM-DD&to=YYYY-MM-DD&productId=<id>
async function getSalesTrend(req, res, next) {
  try {
    const from = parseDate(req.query.from, 'from');
    let to = parseDate(req.query.to, 'to');
    // Make "to" inclusive of the whole day
    if (to) to.setUTCHours(23, 59, 59, 999);

    let productId;
    if (req.query.productId) {
      if (!mongoose.isValidObjectId(req.query.productId)) {
        return res.status(400).json({ message: 'Invalid productId' });
      }
      productId = new mongoose.Types.ObjectId(req.query.productId);
    }

    const pipeline = buildSalesTrendPipeline({ from, to, productId });
    const data = await mongoose.connection.db.collection('orders').aggregate(pipeline).toArray();

    const totals = data.reduce(
      (acc, row) => ({
        revenue: acc.revenue + row.revenue,
        orders: acc.orders + row.orders,
        units: acc.units + row.units,
      }),
      { revenue: 0, orders: 0, units: 0 }
    );
    totals.revenue = Math.round(totals.revenue * 100) / 100;

    res.json({ from: from || null, to: to || null, productId: productId || null, totals, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { buildSalesTrendPipeline, getSalesTrend };
