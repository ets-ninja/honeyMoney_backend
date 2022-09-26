const express = require('express');
const { check, query } = require('express-validator');

const authController = require('../controllers/auth.controllers');

const router = express.Router();

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

router.post(
  '/restore',
  check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
  authController.requestRestorePassword,
);

module.exports = router;
