const express = require('express');
const { check } = require('express-validator');
const passport = require('passport');
const basketController = require('../controllers/basket.controllers');

const router = express.Router();

router.get(
  '/get_owner_baskets',
  passport.authenticate('jwt', { session: false }),
  basketController.getOwnerBaskets,
);

router.get(
  '/get_coowner_baskets',
  passport.authenticate('jwt', { session: false }),
  basketController.getCoownerBaskets,
);

router.get(
  '/get_public_baskets',
  passport.authenticate('jwt', { session: false }),
  basketController.getPublicBaskets,
);

router.get(
  '/get_private_baskets',
  passport.authenticate('jwt', { session: false }),
  basketController.getPrivateBaskets,
);

router.post(
  '/create_basket',
  passport.authenticate('jwt', { session: false }),
  [
    check('basketName').not().isEmpty(),
    check('moneyGoal').not().isEmpty(),
    check('isPublic').not().isEmpty(),
  ],
  basketController.createBasket,
);

router.put('/update_basket/:id', basketController.updateBasket);

router.delete('/delete_basket/:id', basketController.deleteBasket);

router.get(
  '/get_basket_by_id',
  passport.authenticate('jwt', { session: false }),
  basketController.getBasketById,
);

module.exports = router;
