const ObjectId = require('mongoose').Types.ObjectId;
const Basket = require('../models/jar.model');
const User = require('../models/user.model');
const HttpError = require('../utils/http-error');

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

// SHOULD BE DOUBLE CHECKED IF SORTING WORKS WELL
const getSortSettings = order => {
  switch (order) {
    case 'date asc':
      return { creationDate: 1, _id: 1 };
    case 'date desc':
      return { creationDate: -1, _id: 1 };
    case 'value desc':
      return { goal: -1, _id: 1 };
    case 'value asc':
      return { goal: 1, _id: 1 };
    case 'time asc':
      return { expirationDate: 1, _id: 1 };
    case 'time desc':
      return { expirationDate: -1, _id: 1 };
    default:
      return { creationDate: 1, _id: 1 };
  }
};

const lookupAndUnwind = [
  {
    $lookup: {
      from: 'users',
      localField: 'ownerId',
      foreignField: '_id',
      pipeline: [
        {
          $project: {
            email: 0,
            password: 0,
            firstName: 0,
            lastName: 0,
          },
        },
      ],
      as: 'user',
    },
  },
  {
    $lookup: {
      from: 'transactions',
      localField: '_id',
      foreignField: 'basketId',
      pipeline: [
        { $match: { status: 'succeeded' } },
        { $sort: { creationDate: -1 } },
        { $project: { creationDate: 1, comment: 1 } },
      ],
      as: 'transactions',
    },
  },
  { $unwind: '$user' },
];

async function getPublicJars(req, res, next) {
  const sort = getSortSettings(req?.query?.sortOrder);

  try {
    const matchStage = {
      $match: {
        isPublic: true,
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
    next(
      new HttpError(
        `Couldn't fetch public jars. Message: ${error.message}`,
        500,
      ),
    );
  }
}

async function getJarsByFilter(req, res, next) {
  const { filterQuery } = req.query;
  const sort = getSortSettings(req.query?.sortOrder);

  try {
    const matchedUsers = await User.find({
      $text: { $search: filterQuery },
    });
    const matchedUsersIds = matchedUsers.map(el => el._id);

    const matchStage = {
      $match: {
        isPublic: true,
        ownerId: { $in: matchedUsersIds },
      },
    };
    const unionMatchStage = {
      $match: {
        isPublic: true,
        ownerId: { $nin: matchedUsersIds },
        $text: { $search: filterQuery },
      },
    };

    const [{ jarsCount } = { jarsCount: 0 }] = await Basket.aggregate([
      matchStage,
      {
        $unionWith: {
          coll: 'baskets',
          pipeline: [unionMatchStage],
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
            unionMatchStage,
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
    next(
      new HttpError(
        `Couldn't perform search for public jars. Message: ${error.message}`,
        500,
      ),
    );
  }
}

async function getUserJars(req, res, next) {
  const { userToFind } = req.query;
  const sort = getSortSettings(req.query?.sortOrder);

  try {
    const matchStage = {
      $match: {
        isPublic: true,
        ownerId: ObjectId(userToFind),
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
    next(
      new HttpError(
        `Couldn't fetch users public jars. Message: ${error.message}`,
        500,
      ),
    );
  }
}

async function getModalJar(req, res, next) {
  const { jarToFind } = req.query;

  try {
    const modalJar = await Basket.aggregate([
      {
        $match: { isPublic: true, _id: ObjectId(jarToFind) },
      },
      ...lookupAndUnwind,
    ]);

    if (!modalJar.length) {
      return next(new HttpError(`Couldnt find requested jar.`, 404));
    }

    res.status(200).json(...modalJar);
  } catch (error) {
    next(
      new HttpError(
        `Couldn't fetch modal public jar. Message: ${error.message}`,
        500,
      ),
    );
  }
}

module.exports = {
  getPublicJars,
  getJarsByFilter,
  getUserJars,
  getModalJar,
};
