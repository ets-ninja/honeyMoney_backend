const express = require('express');
const { check, oneOf } = require('express-validator');
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
    oneOf([
      check('firstName').not().isEmpty(),
      check('lastName').not().isEmpty(),
      check('publicName').not().isEmpty(),
    ]),
  ],
  userController.updateUser,
);
router.patch(
  '/update_password',
  [
    passport.authenticate('jwt', { session: false }),
    check('password').isLength({ min: 6 }),
    check('newPassword').isLength({ min: 6 }),
  ],
  userController.updatePassword,
);

module.exports = router;
