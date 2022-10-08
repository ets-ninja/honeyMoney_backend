const { validationResult } = require('express-validator');
const HttpError = require('../utils/http-error');
const WishlistItem = require('../models/wishlistItem.model');

async function createWishlistItem(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid or not all inputs passed.', 422));
  }

  const { name, description, finalGoal, image } = req.body;
  const ownerId = req.user.id;

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
      `New wishlist item creation failed, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res
    .status(201)
    .json({ id: wishlistItem._id, message: 'New wishlist item created' });
}

async function getAllWishlistItems(req, res, next) {
  const ownerId = req.user.id;
  let wishlistItems;
  try {
    wishlistItems = await WishlistItem.find({
      ownerId,
    });
  } catch (err) {
    const error = new HttpError(
      `Failed to get all items, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res.status(200).json({
    ...wishlistItems,
  });
}

async function updateWishlistItem(req, res, next) {
  const ownerId = req.user.id;
  const { itemId: _id } = req.params;
  const { name, description, finalGoal, image } = req.body;

  const updatedItem = {
    name,
    description,
    finalGoal,
    image,
  };

  let updated;
  try {
    updated = await WishlistItem.findOneAndUpdate(
      { _id, ownerId },
      updatedItem,
      {
        new: true,
      },
    );

    if (!updated) {
      return res.status(400).json({
        message: 'Attempt to update not existing item.',
      });
    }
  } catch (err) {
    const error = new HttpError(
      `Failed to update this item, please try again. ${err.message}`,
      500,
    );
    return next(error);
  }

  return res.status(202).json({
    updatedItem: updated,
  });
}

async function deleteWishlistItem(req, res, next) {
  const ownerId = req.user.id;
  const { itemId: _id } = req.params;

  try {
    const deleted = await WishlistItem.deleteOne({
      _id,
      ownerId,
    });

    if (!deleted.deletedCount) {
      return res.status(400).json({
        message: 'Attempt to delete not existing item.',
      });
    }
  } catch (err) {
    const error = new HttpError(
      `Failed to delete this item, please try again. ${err.message}`,
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