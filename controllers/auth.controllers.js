const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const HttpError = require('../utils/http-error');
const {
  signToken,
  signRefreshToken,
} = require('../utils/authenticate.helpers');

// Constants
const { ERR, REFRESH_COOKIE_NAME } = require('../constants');

// Models
const User = require('../models/user.model');
const ResetToken = require('../models/email-token.model');

// Services
const sendRestorePasswordMessage = require('../services/email/messages/restorePassword');

async function loginUser(req, res, next) {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401,
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500,
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError('Invalid password, could not log you in.', 401);
    return next(error);
  }

  let token;
  try {
    token = signToken(existingUser.id);
  } catch (err) {
    return next(err);
  }

  let refreshToken;
  try {
    refreshToken = signRefreshToken(existingUser.id);
  } catch (err) {
    return next(err);
  }

  res
    .cookie(REFRESH_COOKIE_NAME, refreshToken, {
      maxAge: 604800000,
      httpOnly: true,
    })
    .status(200)
    .json({
      user: existingUser.toObject({ getters: true }),
      token: 'Bearer ' + token,
    });
}

async function validateEmail(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid email passed.', 422));
  }
  const email = req.query.email.toLowerCase();

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  if (existingUser) {
    const error = new HttpError('Email address already exists.', 422);
    return next(error);
  }

  res.status(204).send();
}

async function restorePassword(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid email passed.', 422));
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: req.body.email });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  if (!existingUser) {
    const error = new HttpError('Email address does not exists.', 404);
    return next(error);
  }

  let token;
  try {
    token = await ResetToken.findOne({ userId: existingUser.id });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }
  if (token) {
    try {
      await token.deleteOne();
    } catch (err) {
      return next(ERR.DB_FAILURE);
    }
  }

  const newToken = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(newToken, 12);

  try {
    await new ResetToken({
      userId: existingUser.id,
      token: hash,
    }).save();
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }
  const link = `${process.env.APP_URL}/restorepassword?token=${newToken}&id=${existingUser.id}`;
  try {
    await sendRestorePasswordMessage(existingUser.email, {
      username: existingUser.firstName,
      link,
    });
  } catch (err) {
    return next(new HttpError('Sending email failed, please try again', 500));
  }
  res.status(200).json({ message: 'Email send' });
}

async function resetPassword(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Password is too short.', 422));
  }

  const { token, id } = req.params;
  const { password } = req.body;

  let existingToken;
  try {
    existingToken = await ResetToken.findOne({ userId: id });
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }
  if (!existingToken) {
    return next(new HttpError('Token is invalid or expired', 422));
  }

  const isValid = await bcrypt.compare(token, existingToken.token);
  if (!isValid) {
    return next(new HttpError('Token is invalid or expired', 422));
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    await User.findOneAndUpdate(
      { _id: id },
      { $set: { password: hash } },
      { new: true },
    );
  } catch (err) {
    return next(ERR.DB_FAILURE);
  }

  res.status(200).json({ message: 'Password updated' });
}

async function googleLogin(req, res, next) {
  let refreshToken;
  try {
    refreshToken = signRefreshToken(req.user.id);
  } catch (err) {
    return next(err);
  }

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    maxAge: 604800000,
    httpOnly: true,
  });
  res.status(301).redirect(`${process.env.APP_URL}`);
}

function refreshUserAcces(req, res, next) {
  let token;
  try {
    token = signToken(req.user.id);
  } catch (err) {
    return next(err);
  }
  res.status(200).json({
    user: { ...req.user.toObject(), id: req.user.id },
    token: `Bearer ${token}`,
  });
}

async function logoutUser(req, res, next) {
  const { notificationToken } = req.body;

  if (notificationToken) {
    let { notificationTokens } = req.user;

    let newNotificationToken;
    try {
      newNotificationToken = notificationTokens.filter(
        token => token !== notificationToken,
      );
    } catch (err) {
      const error = new HttpError(
        'Remove notification token failed, please try again later.',
        500,
      );
      return next(error);
    }

    const updatedUser = {
      notificationTokens: newNotificationToken,
    };

    try {
      await User.findOneAndUpdate({ _id: req.user.id }, updatedUser, {
        new: true,
      });
    } catch (err) {
      const error = new HttpError(
        'Remove notification token failed, please try again later.',
        500,
      );
      return next(error);
    }
  }

  res
    .clearCookie(REFRESH_COOKIE_NAME)
    .status(200)
    .json({ message: 'Logout succesful' });
}

module.exports = {
  loginUser,
  validateEmail,
  restorePassword,
  resetPassword,
  googleLogin,
  refreshUserAcces,
  logoutUser,
};
