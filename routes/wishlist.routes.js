const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const passport = require('passport');

const wishlistController = require('../controllers/wishlist.controllers');

router.post(
  '/',
  [
    passport.authenticate('jwt', { session: false }),
    check('name').not().isEmpty(),
    check('finalGoal').not().isEmpty(),
  ],
  wishlistController.createWishlistItem,
);
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  wishlistController.getWishlistItem,
);
router.patch(
  '/update/:itemId',
  passport.authenticate('jwt', { session: false }),
  wishlistController.updateWishlistItem,
);
router.delete(
  '/delete/:itemId',
  passport.authenticate('jwt', { session: false }),
  wishlistController.deleteWishlistItem,
);
router.get(
  '/sorting/:page/:field/:order',
  passport.authenticate('jwt', { session: false }),
  wishlistController.sortWishlistItems,
);

module.exports = router;
