const Order = require('../models/Order');

// Spend tiers in USD, chosen from the shared seed data (1,000 orders, 99 customers):
// $500 / $1,500 / $3,000 gives roughly 38 / 27 / 13 / 17 customers per tier.
const BOUNDARIES = [0, 500, 1500, 3000];
const DEFAULT_ID = `${BOUNDARIES[BOUNDARIES.length - 1]}+`; // spend >= last boundary

const usd = (n) => `$${n.toLocaleString('en-US')}`;
const TIERS = [
  { id: BOUNDARIES[0], tier: 'Bronze', range: `Below ${usd(BOUNDARIES[1])}` },
  { id: BOUNDARIES[1], tier: 'Silver', range: `${usd(BOUNDARIES[1])} to ${usd(BOUNDARIES[2])}` },
  { id: BOUNDARIES[2], tier: 'Gold', range: `${usd(BOUNDARIES[2])} to ${usd(BOUNDARIES[3])}` },
  { id: DEFAULT_ID, tier: 'Platinum', range: `${usd(BOUNDARIES[3])} and above` },
];

// GET /api/analytics/segments?from=YYYY-MM-DD&to=YYYY-MM-DD  (admin)
// Without from/to: lifetime spend. With them: spend inside that window.
exports.getSegments = async (req, res) => {
  try {
    const match = { status: { $ne: 'cancelled' } };
    const { from, to } = req.query;
    if (from || to) {
      match.orderDate = {};
      if (from) match.orderDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setUTCHours(23, 59, 59, 999);
        match.orderDate.$lte = end;
      }
    }

    const rows = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$user', totalSpend: { $sum: '$total' }, orderCount: { $sum: 1 } } },
      {
        $bucket: {
          groupBy: '$totalSpend',
          boundaries: BOUNDARIES,
          default: DEFAULT_ID,
          output: {
            customers: { $sum: 1 },
            avgSpend: { $avg: '$totalSpend' },
            totalRevenue: { $sum: '$totalSpend' },
          },
        },
      },
    ]);

    const byId = new Map(rows.map((r) => [r._id, r]));
    // Always return every tier (0 customers if a bucket is empty)
    const result = TIERS.map(({ id, tier, range }) => {
      const r = byId.get(id);
      return {
        tier,
        range,
        customers: r ? r.customers : 0,
        avgSpend: r ? Math.round(r.avgSpend) : 0,
        totalRevenue: r ? r.totalRevenue : 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
