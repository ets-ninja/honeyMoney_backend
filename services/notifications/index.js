var admin = require('firebase-admin');

var serviceAccount = require('../../honeymoneyworker-firebase-adminsdk-4ru0p-4db0149331.json');
const logger = require('../logger');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const sendMessage = async (tokens, data, notification) => {
  try {
    await admin.messaging().sendMulticast({
      data,
      notification,
      tokens,
    });
  } catch (error) {
    logger.error('Cant send Notification with FCM', error);
  }
};

module.exports = sendMessage;
