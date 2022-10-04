const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { cookieExtractor } = require('../utils/authenticate.helpers');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const HttpError = require('../utils/http-error');

const User = require('../models/user.model');

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
    User.findOne({ email }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return User.create(
          {
            firstName: given_name,
            lastName: profile.name.familyName || '',
            publicName: name,
            email,
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
