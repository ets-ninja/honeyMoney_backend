const HttpError = require('../utils/http-error');

const RESTORE_PASSWORD_EXPIRE = 3600;

const ERR = {
  DB_FAILURE: new HttpError('Search failed, please try again later.', 500),
};

module.exports = { RESTORE_PASSWORD_EXPIRE, ERR };
