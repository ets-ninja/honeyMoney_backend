const express = require('express');
const passport = require('passport');
const { getPublicJars } = require('../controllers/publicJars.controllers');

const router = express.Router();

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getPublicJars,
);

module.exports = router;
