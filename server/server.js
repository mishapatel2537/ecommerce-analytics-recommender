require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
});