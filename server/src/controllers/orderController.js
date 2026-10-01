const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product'); // from Person A

// Turn my cart into an order
exports.checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const items = [];
    let total = 0;

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) return res.status(400).json({ message: 'A product in your cart no longer exists' });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
      total += product.price * item.quantity;
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      total: Math.round(total * 100) / 100,
    });

    // reduce stock
    for (const i of items) {
      await Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } });
    }

    // empty the cart
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// My past orders, newest first
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
