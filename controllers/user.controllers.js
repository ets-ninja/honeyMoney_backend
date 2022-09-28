const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/http-error');

// Constants
const SECRET = process.env.TOKEN_SECRET;
const { ERR } = require('../constants');

// Models
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
    return next(ERR.DB_FAILURE);
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

  const createdUser = new User({
    firstName,
    lastName,
    publicName,
    email,
    password: hashedPassword,
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

  const { firstName, lastName, publicName } = req.body;

  const updatedUser = {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(publicName && { publicName }),
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

async function updatePassword(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { password, newPassword } = req.body;
  const existingUser = req.user;
  const isValidPassword = await bcrypt.compare(password, existingUser.password);

  if (!isValidPassword) {
    return next(new HttpError('Invalid password', 401));
  }

  const hash = await bcrypt.hash(newPassword, 12);
  existingUser.password = hash;

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(
      'Updating failed, please try again later.',
      500,
    );
    return next(error);
  }

  res.status(200).json({
    userId: existingUser.id,
    message: 'Password updated',
  });
}

async function updateUserPhoto(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  }

  const { userPhoto } = req.body;

  const updatedUser = {
    ...(userPhoto && { userPhoto })
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
    message: 'User photo updated',
  });
}

module.exports = { createUser, updateUser, getUserDetails, updatePassword, updateUserPhoto };
