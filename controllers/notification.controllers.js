const moment = require('moment');

//Constants
const { ERR } = require('../constants');

//Models
const Jar = require('../models/jar.model');

//Services
const logger = require('../services/logger');
const sendMessage = require('../services/notifications');

async function sendNotificationCosExpire(req, res, next) {
  const { _id, notificationTokens } = req.user;

  if (notificationTokens.length > 0) {
    const startOfTheDay = moment().startOf('day');
    const endOf7DayFromNow = moment().add(7, 'days').endOf('day').toISOString();

    let jars;
    try {
      jars = await Jar.find({
        ownerId: _id,
        expirationDate: {
          $gte: new Date(startOfTheDay).getTime(),
          $lte: new Date(endOf7DayFromNow).getTime(),
        },
        notificationDate: {
          $lte: new Date(startOfTheDay).getTime(),
        },
      });
    } catch (err) {
      return next(ERR.DB_FAILURE);
    }

    try {
      jars.forEach(jar => {
        jar.notificationDate = +new Date();
        jar.save();
      });
    } catch {
      return next(ERR.DB_FAILURE);
    }

    jars.forEach(async jar => {
      const diff = moment(
        new Date(jar?.expirationDate).toISOString(),
      ).fromNow();

      const notification = {
        title: `Jar ${jar?.name} will expire soon`,
        body: `Your jar expire ${diff}`,
        image:
          'https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg',
      };
      const data = {
        clickAction: `jar/${jar?._id}`,
        clickActionBack: `${process.env.APP_URL}/jar/${jar?._id}`,
      };

      try {
        await sendMessage(notificationTokens, data, notification);
      } catch (error) {
        logger.error('Can`t send Notification with FCM', error);
      }
    });

    res.status(200).json({ message: 'Notification successfully sent' });
  } else {
    res.status(200).json({ message: 'User haven`t got a notification token' });
  }
}

module.exports = { sendNotificationCosExpire };
