// Generates reviews tied to real purchases. Run AFTER npm run seed:
//   npm run seed:reviews
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Review = require('../src/models/Review');

const RATING_WEIGHTS = [[5, 35], [4, 35], [3, 15], [2, 10], [1, 5]]; // percent
const COMMENTS = {
  5: ['Excellent, exactly as described.', 'Love it, would buy again.', 'Great quality for the price.'],
  4: ['Good product, minor issues only.', 'Works well, happy with it.', 'Solid value.'],
  3: ['Okay, does the job.', 'Average quality.', 'Fine but nothing special.'],
  2: ['Not as good as expected.', 'Quality could be better.'],
  1: ['Disappointed, would not recommend.', 'Stopped working quickly.'],
};

function randomRating() {
  let r = Math.random() * 100;
  for (const [rating, weight] of RATING_WEIGHTS) {
    r -= weight;
    if (r <= 0) return rating;
  }
  return 5;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Review.syncIndexes(); // make sure the unique (product, user) index exists
  await Review.deleteMany({});

  const orders = await Order.find({}, 'user items.product orderDate').lean();
  const seen = new Set();
  const docs = [];

  for (const order of orders) {
    for (const item of order.items) {
      const key = `${order.user}-${item.product}`;
      if (seen.has(key)) continue; // one review per user per product
      if (Math.random() > 0.4) continue; // about 40% of purchases get a review
      seen.add(key);
      const rating = randomRating();
      const options = COMMENTS[rating];
      docs.push({
        product: item.product,
        user: order.user,
        rating,
        comment: options[Math.floor(Math.random() * options.length)],
      });
    }
  }

  try {
    await Review.insertMany(docs, { ordered: false });
  } catch (err) {
    if (!err.writeErrors) throw err; // duplicates are fine, anything else is not
  }

  console.log(`Seeded ${await Review.countDocuments()} reviews.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
