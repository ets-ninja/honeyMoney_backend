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
  '/',
  passport.authenticate('jwt', { session: false }),
  wishlistController.getAllWishlistItems,
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

module.exports = router;