const express = require('express');
const passport = require('passport');
const router = express.Router();

const {postBasket} = require('../controllers/basket.controllers')

router.post('/', passport.authenticate('jwt', { session: false }), postBasket);

module.exports = router;
