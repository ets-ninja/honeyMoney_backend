const express = require('express');
const { check, query } = require('express-validator');
const passport = require('passport');

const authController = require('../controllers/auth.controllers');

const router = express.Router();

router.get(
  '/refresh',
  passport.authenticate('jwt', { session: false }),
  authController.refreshUserAcces,
);

router.get(
  '/validate_email',
  [query('email').normalizeEmail({ gmail_remove_dots: false }).isEmail()],
  authController.validateEmail,
);

router.post(
  '/login',
  [
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  authController.loginUser,
);

router.get('/logout', authController.logoutUser);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.APP_URL,
    session: false,
  }),
  authController.googleLogin,
);

router.post(
  '/restore',
  check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
  authController.restorePassword,
);

router.post(
  '/restore/:token/:id',
  check('password').isLength({ min: 6 }),
  authController.resetPassword,
);

module.exports = router;
