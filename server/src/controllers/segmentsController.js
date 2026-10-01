const Order = require('../models/Order');

// Spend tiers. Adjust BOUNDARIES after looking at your seeded data so each
// tier holds a sensible number of customers.
const BOUNDARIES = [0, 5000, 15000, 40000];
const DEFAULT_ID = `${BOUNDARIES[BOUNDARIES.length - 1]}+`; // spend >= last boundary

const inr = (n) => `\u20B9${n.toLocaleString('en-IN')}`;
const TIERS = [
  { id: 0, tier: 'Bronze', range: `Below ${inr(BOUNDARIES[1])}` },
  { id: 5000, tier: 'Silver', range: `${inr(BOUNDARIES[1])} to ${inr(BOUNDARIES[2] - 1)}` },
  { id: 15000, tier: 'Gold', range: `${inr(BOUNDARIES[2])} to ${inr(BOUNDARIES[3] - 1)}` },
  { id: DEFAULT_ID, tier: 'Platinum', range: `${inr(BOUNDARIES[3])} and above` },
];

// GET /api/analytics/segments  (admin)
exports.getSegments = async (req, res) => {
  try {
    const rows = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
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
