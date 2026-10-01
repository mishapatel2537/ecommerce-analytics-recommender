// Placeholder Order model; replace with the shared model. Keep the same shape:
// items are EMBEDDED and item.product is an ObjectId.
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [itemSchema],
  total: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'delivered' },
});

// Multikey index that speeds up the co-purchase pipeline's first $match.
// Keep this index in the shared Order model too.
orderSchema.index({ 'items.product': 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
