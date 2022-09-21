const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;
const app = express();

mongoose.connection.on('open', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', err => {
  console.log(err);
});

app.use(cors());
app.use(express.json());

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
