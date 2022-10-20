require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const HttpError = require('./utils/http-error');
const passport = require('./middlewares/passport.middleware');
const morganMiddleware = require('./middlewares/morgan.middleware');
const logger = require('./services/logger');

// Consts
const APP_URL = process.env.APP_URL;
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const docsRoute = require('./routes/api-docs.routes');
const basketRoutes = require('./routes/basket.routes');
const payRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors({ origin: APP_URL, credentials: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.json({ limit: '10mb', extended: true }));
app.use(
  express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }),
);
app.use(morganMiddleware);

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/basket', basketRoutes);
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

io.on('connection', socket => {
  console.log('a user connected ');

  socket.on('join', function (room) {
    console.log(`User ${socket.id} joined the room ${room}`);
    socket.join(room);
  });

  socket.on('leave', function () {
    console.log(socket.rooms);
    socket.rooms.forEach(room => {
      console.log(`User ${socket.id} joined the room ${room}`);
      socket.leave(room);
    });
  });

  socket.on('error', err => {
    console.log('received socket error:');
    console.log(err);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URL);
  } catch (err) {
    logger.error(err);
  }

  server.listen(PORT, err => {
    if (err) {
      logger.error(err);
      return;
    }
    logger.info(`Server listens on port ${PORT}`);
  });
}

startServer();
