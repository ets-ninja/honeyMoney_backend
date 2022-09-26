const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/http-error');

const SECRET = process.env.TOKEN_SECRET;
const ERR = require('../utils/default-http-errors');
const User = require('../models/user.model');
const ResetToken = require('../models/reset-token.model');

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
    token = jwt.sign({ sub: existingUser.id }, SECRET, { expiresIn: '1h' });
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again.', 500);
    return next(error);
  }

  res.status(200).json({
    userId: existingUser.id,
    token: 'Bearer ' + token,
  });
}

async function validateEmail(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid email passed.', 422));
  }
  const email = req.query.email.toLowerCase();
  console.log(req.query);

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

async function requestRestorePassword(req, res, next) {
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
      token = await token.deleteOne();
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
   const link = `${process.env.APP_URL}/restore-password/`
}

module.exports = { loginUser, validateEmail, requestRestorePassword };
