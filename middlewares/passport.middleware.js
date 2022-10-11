const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const HttpError = require('../utils/http-error');
const { cookieExtractor } = require('../utils/authenticate.helpers');

// Models
const User = require('../models/user.model');

// Constants
const { USER_STATUS } =require('../constants');

//Services
const {
  createCustomer,
} = require('../services/stripe/create-customer.service');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  cookieExtractor,
]);
opts.secretOrKey = process.env.TOKEN_SECRET;

passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    User.findOne({ _id: jwt_payload.sub }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(new HttpError('User does not exist', 401), false);
      }
    });
  }),
);

const googleConfig = {
  callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

passport.use(
  new GoogleStrategy(googleConfig, function (
    accessToken,
    refreshToken,
    profile,
    done,
  ) {
    const { name, given_name, email } = profile._json;
    User.findOne({ email }, async function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        const stripeUserId = await createCustomer({
          email,
          firstName: given_name,
          lastName: profile.name.familyName || '',
        });
        return User.create(
          {
            firstName: given_name,
            lastName: profile.name.familyName || '',
            publicName: name,
            email,
            stripeUserId,
            status: USER_STATUS.ACTIVE,
          },
          function (err, user) {
            if (err) {
              return done(err, false);
            }
            return done(null, user);
          },
        );
      }
    });
  }),
);

module.exports = passport;
