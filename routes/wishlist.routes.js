const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const wishlistController = require('../controllers/wishlist.controllers');

router.post(
  '/:id',
  [check('name').not().isEmpty(), check('finalGoal').not().isEmpty()],
  wishlistController.createWishlistItem,
);
router.get('/:id', wishlistController.getAllWishlistItems);
router.patch('/:id/update/:itemId', wishlistController.updateWishlistItem);
router.delete('/:id/delete/:itemId', wishlistController.deleteWishlistItem);

module.exports = router;
