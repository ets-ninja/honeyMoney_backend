const { validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const HttpError = require('../utils/http-error');
const {
  signToken,
  signRefreshToken,
} = require('../utils/authenticate.helpers');

// Constants
const { ERR, REFRESH_COOKIE_NAME, USER_STATUS } = require('../constants');

// Models
const User = require('../models/user.model');
const ConfirmEmailToken = require('../models/email-token.model');

// Services
const sendConfirmEmailMessage = require('../services/email/messages/confirmEmail');

// Services
const {
  createCustomer,
} = require('../services/stripe/create-customer.service');

async function getUserDetails(req, res) {
  res
    .status(200)
    .json(req.user.toObject({getters: true}));
}

async function createUser(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(ERR.INVALID_DATA);
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

  const code = crypto.randomBytes(4).toString('hex');
  const hash = await bcrypt.hash(code, 12);

  try {
    await new ConfirmEmailToken({
      userId: createdUser.id,
      token: hash,
    }).save();
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  try {
    await sendConfirmEmailMessage(email, {
      username: firstName,
      code,
    });
  } catch (err) {
    return next(new HttpError('Sending email failed, please try again', 500));
  }

  res.status(201).json({
    user: createdUser.toObject({ getters: true }),
    message: 'Email with confirmation code sent',
  });
}

async function confirmUserEmail(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(ERR.INVALID_DATA);
  }

  const { userId, code } = req.body;

  let savedCode;
  try {
    savedCode = await ConfirmEmailToken.findOne({
      userId,
    });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  if (!savedCode) {
    return next(new HttpError('Code is expired', 404));
  }

  const isValidCode = await bcrypt.compare(code, savedCode.token);

  if (!isValidCode) {
    return next(new HttpError('Code is invalid', 403));
  }

  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  const { email, firstName, lastName } = user;
  let stripeUserId;
  try {
    stripeUserId = await createCustomer({ email, firstName, lastName });
  } catch (err) {
    const error = new HttpError(
      'Could not create a user. Please try again later.',
      500,
    );
    return next(error);
  }

  user.status = USER_STATUS.ACTIVE;
  user.stripeUserId = stripeUserId;

  try {
    await user.save();
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  let token;
  try {
    token = signToken(user.id);
  } catch (err) {
    return next(err);
  }

  let refreshToken;
  try {
    refreshToken = signRefreshToken(user.id);
  } catch (err) {
    return next(err);
  }

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    maxAge: 604800000,
    httpOnly: true,
  });
  res.status(200).json({
    user: user.toObject({getters: true}),
    token: 'Bearer ' + token,
  });
}

async function resendConfirmUserEmail(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(ERR.INVALID_DATA);
  }

  const { userId } = req.body;

  const code = crypto.randomBytes(4).toString('hex');
  const hash = await bcrypt.hash(code, 12);

  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  try {
    await ConfirmEmailToken.findOneAndUpdate(
      {
        userId,
      },
      { token: hash, userId },
      { overwrite: true, upsert: true },
    );
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  try {
    await sendConfirmEmailMessage(user.email, {
      username: user.firstName,
      code,
    });
  } catch (err) {
    return next(new HttpError('Sending email failed, please try again', 500));
  }

  res.status(200).json({
    message: 'Email with confirmation code sent',
  });
}

async function updateUser(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(ERR.INVALID_DATA);
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
    return next(ERR.INVALID_DATA);
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
    return next(ERR.INVALID_DATA);
  }

  const { userPhoto } = req.body;

  const updatedUser = {
    ...(userPhoto && { userPhoto }),
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

module.exports = {
  createUser,
  confirmUserEmail,
  resendConfirmUserEmail,
  updateUser,
  getUserDetails,
  updatePassword,
  updateUserPhoto,
};
