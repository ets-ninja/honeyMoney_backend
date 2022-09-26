const HttpError = require('./http-error');

module.exports = {
  DB_FAILURE: new HttpError('Search failed, please try again later.', 500),
};
