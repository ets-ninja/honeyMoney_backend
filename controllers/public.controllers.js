const Basket = require('../models/basket.model');
const User = require('../models/user.model');
const Participant = require('../models/participant.model');

async function getPublicJars(req, res, next) {
  const userId = req.user?._id;

  try {
    const participants = await Participant.find(
      { user: userId },
      '-_id basket',
    );

    const excludeCOJars = participants.map(el => el.basket);

    const jarsWithUser = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $ne: userId },
          _id: { $nin: excludeCOJars },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
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

    const foundUsersJars = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $in: includeUsers },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ]);

    const participants = await Participant.find(
      { user: userId },
      '-_id basket',
    );
    const excludeCOJars = participants.map(el => el.basket);

    const foundJars = await Basket.aggregate([
      {
        $match: {
          isPublic: true,
          ownerId: { $nin: [userId, ...includeUsers] },
          _id: { $nin: excludeCOJars },
          $text: { $search: filterQuery },
        },
      },
      {
        $sort: { score: { $meta: 'textScore' } },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
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
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicJars,
  getJarsByFilter,
};

/*
We need
-look for user and get his baskets
-look for baskets and get baskets
-lookup all
-union both and give response


first look for in user
get user[check if not himself] id(ids) if found get user baskets(with lookup)


then look for in baskets get baskets if found (with lookup)
union both baskets

*/
