require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const HttpError = require('./utils/http-error');
const passport = require('./middlewares/passport.middleware');
const morganMiddleware = require('./middlewares/morgan.middleware');
const logger = require('./services/logger');

// Consts
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors());
app.use(passport.initialize());
app.use(express.json());
app.use(morganMiddleware);
app.use('/api/auth', authRoutes);
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
  logger.http(error);
  res.status(error.code || 500);
  res.json({ message: error.message || 'Unknown server error' });
});

mongoose.connection.on('open', () => {
  logger.info('MongoDB connected');
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URL);
  } catch (err) {
    logger.error(err);
  }

  app.listen(PORT, err => {
    if (err) {
      logger.error(err);
      return;
    }
    getCustomerPaymentMethods();
    logger.info(`Server listens on port ${PORT}`);
  });
}

startServer();  
