const ObjectId = require('mongoose').Types.ObjectId;
const Basket = require('../models/basket.model');
const User = require('../models/user.model');
const Participant = require('../models/participant.model');

const getParticipantsIds = async userId => {
  const participants = await Participant.find({ user: userId }, '-_id basket');
  return participants.map(el => el?.basket);
};

const getPaginationSettings = (req, jarsCount) => {
  let page = +req.query.page || 1;
  const jarsPerPage = +req.query.jarsPerPage || 9;

  const isPageOverflow = page * jarsPerPage >= jarsCount + jarsPerPage;

  if (page > 1 && isPageOverflow) {
    page = Math.ceil(jarsCount / jarsPerPage) || 1;
  }
  const skip = (page - 1) * jarsPerPage;
  const pageCount = Math.ceil(jarsCount / jarsPerPage);

  return { jarsPerPage, pageCount, skip };
};

const getSortSettings = order => {
  switch (order) {
    case 'Newest to oldest':
      return { createdAt: -1, _id: 1 };
    case 'Oldest to newest':
      return { createdAt: 1, _id: 1 };
    case 'Expensive to cheap':
      return { goal: -1, _id: 1 };
    case 'Cheap to expensive':
      return { goal: 1, _id: 1 };
    case 'Soon to expire':
      return { expirationDate: 1, _id: 1 };
    case 'Far to expire':
      return { expirationDate: -1, _id: 1 };
    default:
      return { createdAt: -1, _id: 1 };
  }
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
  const sort = getSortSettings(req?.query?.sort);

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

    const { jarsPerPage, pageCount, skip } = getPaginationSettings(
      req,
      jarsCount,
    );

    const jarsWithUser = await Basket.aggregate([
      matchStage,
      { $sort: sort },
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

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
  const sort = getSortSettings(req.query?.sort);

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

    const { jarsPerPage, pageCount, skip } = getPaginationSettings(
      req,
      jarsCount,
    );

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
      { $sort: sort },
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

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
  const sort = getSortSettings(req.query?.sort);

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

    const { jarsPerPage, pageCount, skip } = getPaginationSettings(
      req,
      jarsCount,
    );

    const jarsWithUser = await Basket.aggregate([
      matchStage,
      { $sort: sort },
      { $skip: skip },
      { $limit: jarsPerPage },
      ...lookupAndUnwind,
    ]);

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
