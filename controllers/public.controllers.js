const ObjectId = require('mongoose').Types.ObjectId;
const Basket = require('../models/basket.model');
const User = require('../models/user.model');
const Participant = require('../models/participant.model');

const getParticipantsIds = async userId => {
  const participants = await Participant.find({ user: userId }, '-_id basket');
  return participants.map(el => el?.basket);
};

const lookupAndUnwind = [
  {
    $lookup: {
      from: 'users',
      localField: 'ownerId',
      foreignField: '_id',
      as: 'user',
    },
  },
  { $unwind: '$user' },
];

async function getPublicJars(req, res, next) {
  const userId = req.user?._id;

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const jarsWithUser = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $ne: userId },
          _id: { $nin: excludeParticpants },
        },
      },
      ...lookupAndUnwind,
    ]);

    if (!jarsWithUser || jarsWithUser.length === 0) {
      res.status(200).send('Nothing found');
      return;
    }

    res.status(200).json({
      jars: [...jarsWithUser],
    });
  } catch (error) {
    next(error);
  }
}

async function getJarsByFilter(req, res, next) {
  const userId = req.user?._id;
  const { filterQuery } = req.query;

  try {
    const matchedUsers = await User.find({
      $text: { $search: filterQuery },
      _id: { $ne: userId },
    });
    const includeUsers = matchedUsers.map(el => el._id);

    const excludeParticpants = await getParticipantsIds(userId);

    const foundUsersJars = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $in: includeUsers },
          _id: { $nin: excludeParticpants },
        },
      },
      ...lookupAndUnwind,
    ]);

    const foundJars = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $nin: [userId, ...includeUsers] },
          _id: { $nin: excludeParticpants },
          $text: { $search: filterQuery },
        },
      },
      {
        $sort: { score: { $meta: 'textScore' } },
      },
      ...lookupAndUnwind,
    ]);

    if (
      (!foundUsersJars && !foundJars) ||
      (foundUsersJars.length === 0 && foundJars.length === 0)
    ) {
      res.status(200).send('Nothing found');
      return;
    }

    res.status(200).json({
      jars: [...foundUsersJars, ...foundJars],
      users: matchedUsers,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserJars(req, res, next) {
  const userId = req.user?._id;
  const { userToFind } = req.query;

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const jarsWithUser = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: ObjectId(userToFind),
          _id: { $nin: excludeParticpants },
        },
      },
      ...lookupAndUnwind,
    ]);

    if (!jarsWithUser || jarsWithUser.length === 0) {
      res.status(200).send('Nothing found');
      return;
    }

    res.status(200).json({
      jars: [...jarsWithUser],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicJars,
  getJarsByFilter,
  getUserJars,
};
