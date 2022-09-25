const express = require('express');
const { check } = require('express-validator');
const passport = require('passport');

const userController = require('../controllers/user.controllers');

const router = express.Router();

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.getUserDetails,
);

router.post(
  '/signup',
  [
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  userController.createUser,
);

router.patch(
  '/update',
  [
    passport.authenticate('jwt', { session: false }),
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  userController.updateUser,
);

module.exports = router;
