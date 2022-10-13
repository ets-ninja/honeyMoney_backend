const ObjectId = require('mongoose').Types.ObjectId;
const Basket = require('../models/basket.model');
const User = require('../models/user.model');
const Participant = require('../models/participant.model');

const getParticipantsIds = async userId => {
  const participants = await Participant.find({ user: userId }, '-_id basket');
  return participants.map(el => el?.basket);
};

const getPaginationSettings = req => {
  const page = +req.query.page || 1;
  const jarsPerPage = +req.query.jarsPerPage || 1;
  const skip = (page - 1) * jarsPerPage;

  return { jarsPerPage, skip };
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
  const { jarsPerPage, skip } = getPaginationSettings(req);

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const matchStage = {
      $match: {
        isPublic: true,
        ownerId: { $ne: userId },
        _id: { $nin: excludeParticpants },
      },
    };

    const [{ jarsCount } = { jarsCount: 0 }] = await Basket.aggregate([
      matchStage,
      {
        $count: 'jarsCount',
      },
    ]);

    const jarsWithUser = await Basket.aggregate([
      matchStage,
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

    const pageCount = Math.ceil(jarsCount / jarsPerPage);

    res.status(200).json({
      pagination: {
        pageCount,
        jarsCount,
      },
      jars: [...jarsWithUser],
    });
  } catch (error) {
    next(error);
  }
}

async function getJarsByFilter(req, res, next) {
  const userId = req.user?._id;
  const { filterQuery } = req.query;
  const { jarsPerPage, skip } = getPaginationSettings(req);

  try {
    const matchedUsers = await User.find({
      $text: { $search: filterQuery },
      _id: { $ne: userId },
    });
    const includeUsers = matchedUsers.map(el => el._id);

    const excludeParticpants = await getParticipantsIds(userId);

    const matchStage = {
      $match: {
        isPublic: true,
        ownerId: { $in: includeUsers },
        _id: { $nin: excludeParticpants },
      },
    };

    const [{ jarsCount } = { jarsCount: 0 }] = await Basket.aggregate([
      matchStage,
      {
        $unionWith: {
          coll: 'baskets',
          pipeline: [
            {
              $match: {
                isPublic: true,
                ownerId: { $nin: [userId, ...includeUsers] },
                _id: { $nin: excludeParticpants },
                $text: { $search: filterQuery },
              },
            },
          ],
        },
      },
      {
        $count: 'jarsCount',
      },
    ]);

    const foundJars = await Basket.aggregate([
      matchStage,
      {
        $unionWith: {
          coll: 'baskets',
          pipeline: [
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
          ],
        },
      },
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

    const pageCount = Math.ceil(jarsCount / jarsPerPage);

    res.status(200).json({
      pagination: {
        pageCount,
        jarsCount,
      },
      jars: [...foundJars],
      users: matchedUsers,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserJars(req, res, next) {
  const userId = req.user?._id;
  const { userToFind } = req.query;
  const { jarsPerPage, skip } = getPaginationSettings(req);

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const matchStage = {
      $match: {
        isPublic: true,
        ownerId: ObjectId(userToFind),
        _id: { $nin: excludeParticpants },
      },
    };

    const [{ jarsCount } = { jarsCount: 0 }] = await Basket.aggregate([
      matchStage,
      {
        $count: 'jarsCount',
      },
    ]);

    const jarsWithUser = await Basket.aggregate([
      matchStage,
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

    const pageCount = Math.ceil(jarsCount / jarsPerPage);

    res.status(200).json({
      pagination: {
        pageCount,
        jarsCount,
      },
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
