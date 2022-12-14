const { validationResult } = require('express-validator');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Handlebars = require('handlebars')

const HttpError = require('../utils/http-error');

const Jar = require('../models/jar.model');
const Participants = require('../models/participant.model');
const User = require('../models/user.model')

const {
  createCustomer,
} = require('../services/stripe/create-customer.service');

const onePageLimit = 12;

const getOrderArgs = order => {
  switch (order) {
    case 'creation asc':
      return { creationDate: -1, _id: 1 };
    case 'creation desc':
      return { creationDate: 1, _id: 1 };
    case 'goal desc':
      return { goal: -1, _id: 1 };
    case 'goal asc':
      return { goal: 1, _id: 1 };
    case 'expiration asc':
      return { expirationDate: 1, _id: 1 };
    case 'expiration desc':
      return { expirationDate: -1, _id: 1 };
    default:
      return '';
  }
};

async function getOwnerJars(req, res, next) {
  const { id } = req.user;
  const { page, order } = req.query;

  const bottomIndex = (page - 1) * onePageLimit;

  const ownerJarCount = await Jar.countDocuments({ ownerId: ObjectId(id) });

  let jars;
  try {
    jars = await Jar.aggregate([
      { $match: { ownerId: ObjectId(id) } },
      { $sort: getOrderArgs(order) },
      { $skip: bottomIndex },
      { $limit: onePageLimit },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          pipeline: [
            { $project: { email: 0, password: 0, firstName: 0, lastName: 0 } },
          ],
          as: 'user',
        },
      },
      { $set: { user: { $first: '$user' } } },
    ]);
  } catch (error) {
    const err = new HttpError(
      `Error with recieving jars. Message: ${error.message}`,
      500,
    );
    return next(err);
  }

  res.status(200).json({
    basketData: [...jars],
    paginationData: { maxPageAmount: Math.ceil(ownerJarCount / onePageLimit) },
  });
}

async function getCoownerJars(req, res, next) {
  const { id } = req.user;
  const { page, order } = req.query;

  const bottomIndex = (page - 1) * onePageLimit;

  const coownerJarCount = await Participants.countDocuments({
    user: ObjectId(id),
  });

  let jars;
  try {
    jars = await Participants.aggregate([
      { $match: { user: ObjectId(id) } },
      {
        $lookup: {
          from: 'baskets',
          localField: 'basket',
          foreignField: '_id',
          as: 'basket',
        },
      },
      { $replaceWith: { $first: '$basket' } },
      { $sort: getOrderArgs(order) },
      { $skip: bottomIndex },
      { $limit: onePageLimit },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          pipeline: [
            { $project: { email: 0, password: 0, firstName: 0, lastName: 0 } },
          ],
          as: 'user',
        },
      },
      { $set: { user: { $first: '$user' } } },
    ]);
  } catch (error) {
    return next(error);
  }

  res.status(200).json({
    basketData: [...jars],
    paginationData: {
      maxPageAmount: Math.ceil(coownerJarCount / onePageLimit),
    },
  });
}

async function getPublicJars(req, res, next) {
  const { id } = req.user;
  const { page, order } = req.query;

  const bottomIndex = (page - 1) * onePageLimit;

  const ownerJarCount = await Jar.countDocuments({
    ownerId: ObjectId(id),
    isPublic: true,
  });
  const coownerJarCount = await Participants.find({ user: ObjectId(id) })
    .populate('basket')
    .where('basket.isPublic')
    .equals(true)
    .countDocuments();

  const totalJarCount = ownerJarCount + coownerJarCount;

  let jars;
  try {
    jars = await Jar.aggregate([
      { $match: { ownerId: ObjectId(id), isPublic: true } },
      {
        $unionWith: {
          coll: 'participants',
          pipeline: [
            { $match: { user: ObjectId(id) } },
            {
              $lookup: {
                from: 'baskets',
                localField: 'basket',
                foreignField: '_id',
                as: 'basket',
              },
            },
            { $replaceWith: { $first: '$basket' } },
            { $match: { isPublic: true } },
          ],
        },
      },
      { $sort: getOrderArgs(order) },
      { $skip: bottomIndex },
      { $limit: onePageLimit },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          pipeline: [
            { $project: { email: 0, password: 0, firstName: 0, lastName: 0 } },
          ],
          as: 'user',
        },
      },
      { $set: { user: { $first: '$user' } } },
    ]);
  } catch (error) {
    return next(error);
  }

  res.status(200).json({
    basketData: [...jars],
    paginationData: { maxPageAmount: Math.ceil(totalJarCount / onePageLimit) },
  });
}

async function getPrivateJars(req, res, next) {
  const { id } = req.user;
  const { page, order } = req.query;

  const bottomIndex = (page - 1) * onePageLimit;

  const ownerJarCount = await Jar.countDocuments({
    ownerId: ObjectId(id),
    isPublic: false,
  });
  const coownerJarCount = await Participants.find({ user: ObjectId(id) })
    .populate('basket')
    .where('basket.isPublic')
    .equals(false)
    .countDocuments();
  const totalJarCount = ownerJarCount + coownerJarCount;

  let jars;
  try {
    jars = await Jar.aggregate([
      { $match: { ownerId: ObjectId(id), isPublic: false } },
      {
        $unionWith: {
          coll: 'participants',
          pipeline: [
            { $match: { user: ObjectId(id) } },
            {
              $lookup: {
                from: 'baskets',
                localField: 'basket',
                foreignField: '_id',
                as: 'basket',
              },
            },
            { $replaceWith: { $first: '$basket' } },
            { $match: { isPublic: false } },
          ],
        },
      },
      { $sort: getOrderArgs(order) },
      { $skip: bottomIndex },
      { $limit: onePageLimit },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          pipeline: [
            { $project: { email: 0, password: 0, firstName: 0, lastName: 0 } },
          ],
          as: 'user',
        },
      },
      { $set: { user: { $first: '$user' } } },
    ]);
  } catch (error) {
    return next(error);
  }

  res.status(200).json({
    basketData: [...jars],
    paginationData: { maxPageAmount: Math.ceil(totalJarCount / onePageLimit) },
  });
}

async function createBasket(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid or not all inputs passed.', 422));
  }

  let stripeId;

  try {
    stripeId = await createCustomer({
      email: '',
      firstName: req.body.basketName,
      lastName: 'Basket',
    });
  } catch (err) {
    return next(
      new HttpError(
        `Error when creating a basket appeared. Message: ${err.message}`,
        500,
      ),
    );
  }

  let basket;
  try {
    basket = await Jar.create({
      ownerId: req.user._id,
      name: req.body.basketName,
      description: req.body.description,
      goal: req.body.moneyGoal,
      value: 0,
      expirationDate: req.body.expirationDate,
      isPublic: req.body.isPublic,
      creationDate: +new Date(),
      notificationDate: +new Date(),
      image: req.body.photoTag,
      stripeId,
    });
  } catch (error) {
    return next(
      new HttpError(
        `Error when creating a basket appeared. Message: ${error.message}`,
        500,
      ),
    );
  }

  res
    .status(201)
    .json({ id: basket._id, message: 'Successfully created a basket.' });
}

async function updateJar(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { id, name, expirationDate, description, goal } = req.body;

  const updatedJar = {
    ...(name && { name }),
    ...(goal && { goal }),
    ...(expirationDate && { expirationDate }),
    ...(description && { description }),
  };

  let existingJar;
  try {
    existingJar = await Jar.findOneAndUpdate({ _id: id }, updatedJar, {
      new: true,
    }).select('-image -ownerId');
  } catch (err) {
    const error = new HttpError(
      'Updating failed, please try again later.',
      500,
    );
    return next(error);
  }

  res.status(200).json({
    jar: existingJar,
    message: 'Jar data updated',
  });
}

async function updateJarImage(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { id, image } = req.body;

  const updatedJar = {
    ...(image && { image }),
  };

  let existingJar;
  try {
    existingJar = await Jar.findOneAndUpdate({ _id: id }, updatedJar, {
      new: true,
    }).select('image');
  } catch (err) {
    const error = new HttpError(
      'Updating failed, please try again later.',
      500,
    );
    return next(error);
  }

  res.status(200).json({
    jar: existingJar,
    message: 'Jar data updated',
  });
}

async function getJarById(req, res, next) {
  const { id } = req.query;

  let jar = {};

  try {
    jar = await Jar.aggregate([
      { $match: { _id: ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          pipeline: [
            { $project: { email: 0, password: 0, firstName: 0, lastName: 0 } },
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
            { $sort: { createdAt: -1 } },
            { $project: { card: 0 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      userPhoto: 0,
                      email: 0,
                      password: 0,
                      notificationTokens: 0,
                    },
                  },
                ],
                as: 'user',
              },
            },
            { $set: { user: { $first: '$user' } } },
          ],
          as: 'transactions',
        },
      },
    ]);
  } catch (err) {
    return next(new HttpError(`No jar with ${id} id exists`, 500));
  }

  res.status(200).json({ basket: jar });
}

async function getJarFinanceById(req, res, next) {
  const { id } = req.query;

  let jar = {};

  try {
    jar = await Jar.aggregate([
      { $match: { _id: ObjectId(id) } },
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'basketId',
          pipeline: [
            { $match: { status: 'succeeded' } },
            { $sort: { createdAt: -1 } },
            { $project: { card: 0 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      userPhoto: 0,
                      email: 0,
                      password: 0,
                      notificationTokens: 0,
                    },
                  },
                ],
                as: 'user',
              },
            },
            { $set: { user: { $first: '$user' } } },
          ],
          as: 'transactions',
        },
      },
      { $project: { value: 1, transactions: 1 } },
    ]);
  } catch (err) {
    return next(new HttpError(`No jar with ${id} id exists`, 500));
  }

  res.status(200).json({ basket: jar });
}

async function shareBasket(req, res, next) {
  const basket = await Jar.findOne({ _id: req.params.id });
  const owner = await User.findOne({ _id: basket.ownerId });

  try {
    if (basket.isPublic === false) {
      return next(new HttpError('This basket is not public', 404));
    }

    Handlebars.registerHelper('setPublicKey', () => {
      return process.env.STRIPE_PK_TEST;
    });

    Handlebars.registerHelper('setApiHost', () => {
      return process.env.API_URL;
    });

    res.render('index', {
      basketId: req.params.id,
      basketName: basket.name,
      description: basket.description,
      accumulated: basket.value,
      goal: basket.goal,
      basketPhoto: basket.image,
      userName: owner.firstName,
      userPhoto: owner.userPhoto,
      path: process.env.APP_URL,
    });
  } catch (error) {
    return next(
      new HttpError(
        `Error when creating a basket appeared. Message: ${error.message}`,
        500,
      ),
    );
  }
}


module.exports = {
  getOwnerJars,
  getCoownerJars,
  getPublicJars,
  getPrivateJars,
  createBasket,
  updateJar,
  updateJarImage,
  //deleteJar,
  getJarById,
  getJarFinanceById,
  shareBasket,
};
