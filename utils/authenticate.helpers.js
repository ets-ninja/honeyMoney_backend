const jwt = require('jsonwebtoken');

// Constants
const { REFRESH_COOKIE_NAME, ERR } = require('../constants');
const SECRET = process.env.TOKEN_SECRET;

function cookieExtractor(req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[REFRESH_COOKIE_NAME];
  }
  return token;
}

function signJwt(expiresIn, id) {
  let token;
  try {
    token = jwt.sign({ sub: id }, SECRET, { expiresIn });
  } catch (err) {
    throw ERR.JWT_SIGN_FAILURE;
  }
  return token;
}

const signToken = signJwt.bind(null, '1d');
const signRefreshToken = signJwt.bind(null, '7d');

module.exports = { cookieExtractor, signToken, signRefreshToken };
