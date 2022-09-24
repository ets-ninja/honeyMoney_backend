const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/http-error');

const SECRET = process.env.TOKEN_SECRET;
const User = require('../models/user.model');

async function loginUser(req, res, next) {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500,
    );
    return next(error);
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
    const error = new HttpError('Search failed, please try again later.', 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError('Email address already exists.', 422);
    return next(error);
  }

  res.status(204).send();
}

module.exports = { loginUser, validateEmail };
