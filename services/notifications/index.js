var admin = require('firebase-admin');

var serviceAccount = require('../../honeymoneyworker-firebase-adminsdk-4ru0p-4db0149331.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const sendMessage = async (userTokens, data, notification) => {
  try {
    await admin.messaging().sendMulticast({
      data,
      notification,
      tokens: userTokens,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = sendMessage;
