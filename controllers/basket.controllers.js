const { validationResult } = require('express-validator');
const HttpError = require('../utils/http-error');

const Basket = require('../models/basket.model');
const Participants = require('../models/participant.model');
const User = require('../models/user.model')

/*
function includes(baskets, basket) {
    for(let i = 0; i < baskets.length; i++){
        if(JSON.stringify(baskets[i]) === JSON.stringify(basket)) { return true; }
    }
    return false;
}s
*/

async function getOwnerBaskets(req, res, next) {
  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  const baskets = await Basket.find({ ownerId: req.user._id });
  res.status(200).json(baskets);
}

async function getCoownerBaskets(req, res, next) {
  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  const baskets = await (
    await Participants.find({ user: req.user._id }).populate('basket')
  ).map(doc => {
    console.log(
      new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate(),
    );
    doc.basket.isHot =
      new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate() <
      7;
    return doc.basket;
  });

  res.status(200).json([...baskets]);
}

async function getHotBaskets(req, res, next) {
  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  const ownerBaskets = await Basket.find({ ownerId: req.user._id });

  const coownerBaskets = await (
    await Participants.find({ user: req.user._id }).populate('basket')
  ).map(doc => {
    console.log(
      new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate(),
    );
    doc.basket.isHot =
      new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate() <
      7;
    return doc.basket;
  });

  const baskets = [...ownerBaskets, ...coownerBaskets];

  res.status(200).json([...baskets]);
}

async function getPublicBaskets(req, res, next) {
  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  const ownerBaskets = await Basket.find({
    ownerId: req.user._id,
    isPublic: true,
  });

  const coownerBaskets = await (
    await Participants.find({ user: req.user._id }).populate('basket')
  )
    .map(doc => {
      console.log(
        new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate(),
      );
      doc.basket.isHot =
        new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate() <
        7;
      return doc.basket;
    })
    .filter(basket => basket.isPublic === true);

  const baskets = [...ownerBaskets, ...coownerBaskets];

  res.status(200).json([...baskets]);
}

async function getPrivateBaskets(req, res, next) {
  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  const ownerBaskets = await Basket.find({
    ownerId: req.user._id,
    isPublic: false,
  });

  const coownerBaskets = await (
    await Participants.find({ user: req.user._id }).populate('basket')
  )
    .map(doc => {
      console.log(
        new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate(),
      );
      doc.basket.isHot =
        new Date(Date.parse(doc.basket.expirationDate) - Date.now()).getDate() <
        7;
      return doc.basket;
    })
    .filter(basket => basket.isPublic === false);

  const baskets = [...ownerBaskets, ...coownerBaskets];

  res.status(200).json([...baskets]);
}

async function createBasket(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid or not all inputs passed.', 422));
  }

  if (!req.user) {
    return next(new HttpError('A user is not logged in.', 401));
  }

  let basket;

  try {
    basket = await Basket.create({
      ownerId: req.user._id,
      name: req.body.name,
      description: req.body.description,
      goal: req.body.goal,
      value: req.body.value,
      expirationDate: req.body.expirationDate,
      isPublic: req.body.isPublic,
      creationDate: Date.now(),
      image: req.body.image,
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

async function updateBasket(req, res, next) {}

async function deleteBasket(req, res, next) {
  const id = req.params.id;

  const deleted = Basket.deleteOne({ _id: id });
}

async function shareBasket(req, res, next) {
  const basket = await Basket.findOne({ _id: req.params.id });
  const owner = await User.findOne({ _id: basket.ownerId });

  try {
    if (basket.isPublic === false) {
      return next(new HttpError('This basket is not public', 404));
    }

    res.render('index', {
      basketId: req.params.id,
      basketName: basket.name,
      description: basket.description,
      accumulated: basket.value,
      goal: basket.goal,
      basketPhoto: basket.image,
      userName: owner.firstName,
      userPhoto: owner.userPhoto,
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getOwnerBaskets,
  getCoownerBaskets,
  getHotBaskets,
  getPublicBaskets,
  getPrivateBaskets,
  createBasket,
  updateBasket,
  deleteBasket,
  shareBasket,
};
