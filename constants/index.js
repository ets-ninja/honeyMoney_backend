const HttpError = require('../utils/http-error');

const RESTORE_PASSWORD_EXPIRE = 3600;

const REFRESH_COOKIE_NAME = 'restore';

const ERR = {
  DB_FAILURE: new HttpError('Search failed, please try again later.', 500),
  JWT_SIGN_FAILURE: new HttpError(
    'Something went wrong, please try again later.',
    500,
  ),
};

module.exports = { RESTORE_PASSWORD_EXPIRE, ERR, REFRESH_COOKIE_NAME };
