const { validationResult } = require('express-validator');
const HttpError = require('../utils/http-error');

const User = require('../models/user.model');

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
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  const createdUser = new User({
    firstName,
    lastName,
    publicName,
    email,
    password,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res.status(201).json({
    user: createdUser.toObject({
      getters: true,
      versionKey: false,
    }),
  });
}

async function loginUser(req, res, next) {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  res.status(200).json({ message: 'Logged in!' });
}

async function validateEmail(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid email passed.', 422));
  }
  const email = req.query.email.toLowerCase();
  console.log(req.query);

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Search failed, please try again later.', 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError('Email address already exists.', 422);
    return next(error);
  }

  res.status(204).send();
}

module.exports = { createUser, loginUser, validateEmail };
