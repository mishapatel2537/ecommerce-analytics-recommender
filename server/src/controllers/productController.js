const mongoose = require('mongoose');
const Product = require('../models/Product');

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function badId(res) {
  return res.status(400).json({ message: 'Invalid product id' });
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&inStock=true&sort=&page=&limit=
async function listProducts(req, res, next) {
  try {
    const { search, category, minPrice, maxPrice, inStock, sort } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

    const filter = {};
    if (search?.trim()) filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !Number.isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice && !Number.isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[sort] || SORTS.name_asc)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/categories  -> [{ category, count }]
async function listCategories(req, res, next) {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
    ]);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

const pickFields = ({ name, category, price, stock }) =>
  Object.fromEntries(Object.entries({ name, category, price, stock }).filter(([, v]) => v !== undefined));

// POST /api/products  (admin)
async function createProduct(req, res, next) {
  try {
    const product = await Product.create(pickFields(req.body));
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

// PUT /api/products/:id  (admin)
async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const product = await Product.findByIdAndUpdate(req.params.id, pickFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id  (admin)
async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted', product });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, listCategories, getProduct, createProduct, updateProduct, deleteProduct };
