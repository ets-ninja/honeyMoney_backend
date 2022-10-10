const express = require('express');
const passport = require('passport');
const {
  getPublicJars,
  getJarsByFilter,
} = require('../controllers/public.controllers');

const router = express.Router();

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getPublicJars,
);

router.get(
  '/filter',
  passport.authenticate('jwt', { session: false }),
  getJarsByFilter,
);

module.exports = router;
