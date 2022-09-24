const express = require('express');
const { check, query } = require('express-validator');
const passport = require('passport');

const authController = require('../controllers/auth.controllers');

const router = express.Router();

router.get(
  '/validate_email',
  [query('email').normalizeEmail({ gmail_remove_dots: false }).isEmail()],
  authController.validateEmail
);

router.post(
  '/login',
  [
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  authController.loginUser
);

module.exports = router;
