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
  const page = +req.params.page || 1;
  const itemsPerPage = +req.params.perPage || 9;
  const skip = (page - 1) * itemsPerPage;

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const [{ jarsCount }] = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $ne: userId },
          _id: { $nin: excludeParticpants },
        },
      },
      {
        $count: 'jarsCount',
      },
    ]);

    const jarsWithUser = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $ne: userId },
          _id: { $nin: excludeParticpants },
        },
      },
      { $skip: skip },
      { $limit: itemsPerPage },
      ...lookupAndUnwind,
    ]);

    if (jarsWithUser.length === 0) {
      res.status(200).send('Nothing found');
      return;
    }

    const pageCount = Math.ceil(jarsCount / itemsPerPage);

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
  const page = +req.params.page || 1;
  const itemsPerPage = +req.params.perPage || 9;
  const skip = (page - 1) * itemsPerPage;

  try {
    const matchedUsers = await User.find({
      $text: { $search: filterQuery },
      _id: { $ne: userId },
    });
    const includeUsers = matchedUsers.map(el => el._id);

    const excludeParticpants = await getParticipantsIds(userId);

    const [{ jarsCount }] = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $in: includeUsers },
          _id: { $nin: excludeParticpants },
        },
      },
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
      {
        $match: {
          isPublic: true,
          ownerId: { $in: includeUsers },
          _id: { $nin: excludeParticpants },
        },
      },
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
      { $limit: itemsPerPage },
      ...lookupAndUnwind,
    ]);

    if (foundJars.length === 0) {
      res.status(200).send('Nothing found');
      return;
    }

    const pageCount = Math.ceil(jarsCount / itemsPerPage);

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
  const page = +req.params.page || 1;
  const itemsPerPage = +req.params.perPage || 1;
  const skip = (page - 1) * itemsPerPage;

  try {
    const excludeParticpants = await getParticipantsIds(userId);

    const [{ jarsCount }] = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: ObjectId(userToFind),
          _id: { $nin: excludeParticpants },
        },
      },
    ]);

    const jarsWithUser = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: ObjectId(userToFind),
          _id: { $nin: excludeParticpants },
        },
      },
      { $skip: skip },
      { $limit: itemsPerPage },
      ...lookupAndUnwind,
    ]);

    if (jarsWithUser.length === 0) {
      res.status(200).send('Nothing found');
      return;
    }

    const pageCount = Math.ceil(jarsCount / itemsPerPage);

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
