const HttpError = require('../utils/http-error');

const EMAIL_EXPIRE = 3600;

const REFRESH_COOKIE_NAME = 'restore';

const ERR = {
  DB_FAILURE: new HttpError('Search failed, please try again later.', 500),
  JWT_SIGN_FAILURE: new HttpError(
    'Something went wrong, please try again later.',
    500,
  ),
};

const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
};

module.exports = {
  EMAIL_EXPIRE,
  ERR,
  REFRESH_COOKIE_NAME,
  USER_STATUS,
};
