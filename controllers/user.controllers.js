const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/http-error');
const stripe = require('stripe')(process.env.STRIPE_SK_TEST)

// eslint-disable-next-line no-undef
const SECRET = process.env.TOKEN_SECRET;
const User = require('../models/user.model');

async function getUserDetails(req, res) {
  const { firstName, lastName, publicName, email, createdAt, id } = req.user;

  res
    .status(200)
    .json({ firstName, lastName, publicName, email, createdAt, id });
}

async function createUser(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { firstName, lastName, publicName, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500,
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422,
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create a user. Please try again later.',
      500,
    );
    return next(error);
  }

  let customer_id;
  try{
    const customer = await stripe.customers.create({ email: email, name: `${firstName} ${lastName}` });
    customer_id = await bcrypt.hash(customer.id, 12)
  }catch(err){
    const error = new HttpError(
        'Could not create a user. Please try again later.',
        500,
    )
    return next(error);
}

  const createdUser = new User({
    firstName,
    lastName,
    publicName,
    email,
    password: hashedPassword,
    stripeUserId: customer_id,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ sub: createdUser.id }, SECRET, { expiresIn: '1h' });
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    token: 'Bearer ' + token,
  });
}

async function updateUser(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { firstName, lastName, publicName, password } = req.body;

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not update a user. Please try again later.',
      500,
    );
    return next(error);
  }

  const updatedUser = {
    firstName,
    lastName,
    ...(publicName && { publicName }),
    password: hashedPassword,
  };

  let existingUser;
  try {
    existingUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      updatedUser,
      { new: true },
    );
  } catch (err) {
    const error = new HttpError(
      'Updating failed, please try again later.',
      500,
    );
    return next(error);
  }

  res.status(200).json({
    userId: existingUser.id,
    message: 'User data updated',
  });
}

module.exports = { createUser, updateUser, getUserDetails };
