var admin = require('firebase-admin');

var serviceAccount = require('../../honeymoneyworker-firebase-adminsdk-4ru0p-4db0149331.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const sendMessage = async () => {
  try {
    await admin.messaging().sendMulticast({
      data: {
        title: 'Hello',
        body: 'World',
        clickAction: 'http//:localhost:3000/myjars',
      },
      notification: {
        title: 'Alex Ordynski',
        body: ' -- 101$ on medicines jar',
        image:
          'https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg',
      },
      tokens: [
        'dMzl0zE3rfovi9NzGSBLYx:APA91bGqKbHtjqhtMGq8BkVv7EZcFkrbzOBiQSGcOux2MQj_2Fk0Fdm9Cx1ytK4kAdCRsaVivh4l-MYLEVHwVbjokk_omIIaIbkfDT9jAy9s5e3KU5u95JxKEU_0fhuDzvM7rVeaC8U3',
      ],
    });
    //console.log('success');
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = sendMessage;
