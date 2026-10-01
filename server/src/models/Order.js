const mongoose = require('mongoose');

// Follows the shared Order shape in the README: items are EMBEDDED and
// item.product is an ObjectId, so every pipeline can $unwind them directly.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // copied at purchase time
    price: { type: Number, required: true }, // price at purchase time
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  orderDate: { type: Date, default: Date.now },
});

// Sales trend: date range (+ optional product). See docs/indexing-notes.md
orderSchema.index({ orderDate: 1, 'items.product': 1 });
// Co-purchase ("also bought") $match on one product. See docs/segments-and-cooccurrence.md
orderSchema.index({ 'items.product': 1 });
// "My orders", newest first
orderSchema.index({ user: 1, orderDate: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
