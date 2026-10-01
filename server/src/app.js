const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// 404 for unknown API routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Bad input caught by Mongoose schema validation / type casting / malformed JSON
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || 'Server error' });
});

module.exports = app;
