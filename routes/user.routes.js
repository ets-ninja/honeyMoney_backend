const express = require('express');
const { check, query } = require('express-validator');

const userController = require('../controllers/user.controllers');

const router = express.Router();

router.get(
  '/validate_email',
  [query('email').normalizeEmail({ gmail_remove_dots: false }).isEmail()],
  userController.validateEmail
);

router.post(
  '/signup',
  [
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  userController.createUser
);

router.post(
  '/login',
  [
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  userController.loginUser
);

module.exports = router;
