require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const HttpError = require('./utils/http-error');
const passport = require('./middlewares/passport.middleware');
const morganMiddleware = require('./middlewares/morgan.middleware');
const logger = require('./services/logger');
const expressHandlebars = require('express-handlebars');
const path = require('path');
// Consts
const APP_URL = process.env.APP_URL;
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const docsRoute = require('./routes/api-docs.routes');
const payRoutes = require('./routes/payment.routes');
const basketRoutes = require('./routes/basket.routes');
const shareBasket = require('./routes/share-basket.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();


const hbs = expressHandlebars.create({
  defaultLayout: 'main',
  extname: 'handlebars',
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(cors({ origin: APP_URL, credentials: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit: "10mb", extended: true}))
app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit: 50000}))
app.use(morganMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/basket', basketRoutes);
app.use('/basket', shareBasket)
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/api_docs', docsRoute);
app.use('/api/payment', payRoutes);
app.use('/api/public', publicRoutes);

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
    logger.info(`Server listens on port ${PORT}`);
  });
}

startServer();
