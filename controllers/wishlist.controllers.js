const { validationResult } = require('express-validator');
const HttpError = require('../utils/http-error');
const WishlistItem = require('../models/wishlistItem.model');

async function createWishlistItem(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid or not all inputs passed.', 422));
  }

  const { name, description, finalGoal, image } = req.body;
  const ownerId = req.params.id;

  let wishlistItem;
  try {
    wishlistItem = await WishlistItem.create({
      name,
      ownerId,
      image,
      description,
      finalGoal,
    });
  } catch (err) {
    const error = new HttpError(
      `New wishlist bank creation failed, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res
    .status(201)
    .json({ id: wishlistItem._id, message: 'New wishlist bank created' });
}

async function getAllWishlistItems(req, res, next) {
  const userId = req.params.id;

  let wishlistItems;
  try {
    wishlistItems = await WishlistItem.find({
      ownerId: userId,
    });
  } catch (err) {
    const error = new HttpError(
      `Failed to get all banks, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res.status(200).json({
    ...wishlistItems,
  });
}

async function updateWishlistItem(req, res, next) {
  const { id: userId, itemId } = req.params;
  const { name, description, finalGoal, image } = req.body;

  const updatedItem = {
    name,
    description,
    finalGoal,
    image,
  };

  try {
    const updated = await WishlistItem.findOneAndUpdate(
      { _id: itemId, ownerId: userId },
      updatedItem,
      {
        new: true,
      },
    );

    if (!updated) {
      return res.status(400).json({
        message: 'Attempt to update not own or existing bank.',
      });
    }
  } catch (err) {
    const error = new HttpError(
      `Failed to update this bank, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res.status(202).json({
    message: 'Wishlist item updated',
  });
}

async function deleteWishlistItem(req, res, next) {
  const { id: userId, itemId } = req.params;

  try {
    const deleted = await WishlistItem.deleteOne({
      _id: itemId,
      ownerId: userId,
    });

    if (!deleted.deletedCount) {
      return res.status(400).json({
        message: 'Attempt to delete not existing bank.',
      });
    }
  } catch (err) {
    const error = new HttpError(
      `Failed to delete this bank, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res.status(200).json({
    message: 'Wishlist item deleted',
  });
}

module.exports = {
  createWishlistItem,
  getAllWishlistItems,
  updateWishlistItem,
  deleteWishlistItem,
};
