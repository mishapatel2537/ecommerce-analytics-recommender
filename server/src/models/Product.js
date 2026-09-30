//Temporary
const mongoose = require('mongoose');
module.exports = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number }));