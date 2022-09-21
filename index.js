const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const HttpError = require('./utils/http-error');

require('dotenv').config();

// Consts
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

// Routes
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);

// 404 Route should be at the end of all routes
app.use((req, res, next) => {
  const error = new HttpError('Route does not exist', 404);
  throw error;
});

// error handler should be at the and of all middleware
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'Unknown server error' });
});

mongoose.connection.on('open', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', err => {
  console.log(err);
});

async function startServer() {
  await mongoose.connect(MONGO_URL);

  app.listen(PORT, err => {
    if (err) {
      console.err(err);
      return;
    }
    console.log(`Server listens on port ${PORT}`);
  });
}

startServer();
