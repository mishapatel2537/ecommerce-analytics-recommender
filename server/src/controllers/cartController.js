const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Show my cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId', 'name price stock category');
    res.json(cart || { userId: req.user.id, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a product to my cart
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity ?? 1);
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Invalid product id' });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });
    if (!(await Product.exists({ _id: productId }))) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const existing = cart.items.find(i => i.productId.toString() === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ productId, quantity });

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change the quantity of one item
exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity)) return res.status(400).json({ message: 'Quantity must be a whole number' });
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity < 1) {
      cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove one item
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};