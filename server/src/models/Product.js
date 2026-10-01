// Placeholder Product model; replace with the shared model. Keep the model name 'Product'.
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
