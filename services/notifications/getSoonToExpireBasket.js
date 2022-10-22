const moment = require('moment');

const Basket = require('../../models/basket.model');
const logger = require('../logger');

const getSoonToExpireBasket = async userId => {
  const startOfTheDay = moment().startOf('day');
  const endOf7DayFromNow = moment().add(7, 'days').endOf('day').toISOString();

  let jars, notificationArr;
  try {
    jars = await Basket.find({
      ownerId: userId,
      expirationDate: {
        $gte: new Date(startOfTheDay).getTime(),
        $lte: new Date(endOf7DayFromNow).getTime(),
      },
      notificationDate: {
        $lte: new Date(startOfTheDay).getTime(),
      },
    });
  } catch (err) {
    logger.error('Cant find jars');
  }

  try {
    jars.forEach(jar => {
      jar.notificationDate = +new Date();
      jar.save();
    });

    notificationArr = jars.map(jar => {
      const diff = moment(new Date(jar.expirationDate).toISOString()).fromNow();

      return {
        notification: {
          title: `Jar ${jar.name} will expire soon`,
          body: `Your jar expire ${diff}`,
          image:
            'https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg',
        },
        data: {
          clickAction: `basket/${jar._id}`,
          clickActionBack: `${process.env.APP_URL}/basket/${jar._id}`,
        },
      };
    });
  } catch {
    logger.error('Cant update jars');
  }

  return notificationArr;
};

module.exports = getSoonToExpireBasket;
