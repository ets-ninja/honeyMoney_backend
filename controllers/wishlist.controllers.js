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

  try {
    const wishlistItem = await WishlistItem.create({
      name,
      ownerId,
      image,
      description,
      finalGoal,
    });

    return res.status(201).json({ id: wishlistItem._id });
  } catch (err) {
    const error = new HttpError(
      'New wishlist item creation failed, please try again.',
      500,
    );
    return next(error);
  }
}

async function getWishlistItem(req, res, next) {
  const { itemId: _id } = req.params;

  try {
    const wishlistItem = await WishlistItem.find({
      _id,
    });

    return res.status(200).json(...wishlistItem);
  } catch (err) {
    const error = new HttpError(
      'Failed to get all items, please try again.',
      500,
    );
    return next(error);
  }
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

  try {
    const updated = await WishlistItem.findOneAndUpdate(
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

    return res.status(202).json({
      updatedItem: updated,
    });
  } catch (err) {
    const error = new HttpError(
      'Failed to update this item, please try again.',
      500,
    );
    return next(error);
  }
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

    return res.status(200).json({
      message: 'Wish item deleted successfully',
    });
  } catch (err) {
    const error = new HttpError(
      'Failed to delete this item, please try again.',
      500,
    );
    return next(error);
  }
}

async function sortWishlistItems(req, res, next) {
  const ownerId = req.user.id;
  const { field, order } = req.query;
  const page = +req.query.page || 1;
  const itemsPerPage = 8;

  const skip = (page - 1) * itemsPerPage;

  // All sort settings
  let sort = {};
  sort[field] = order;

  try {
    const countItems = await WishlistItem.countDocuments({ ownerId });

    const sortedItems = await WishlistItem.find({ ownerId })
      .sort({ ...sort, _id: 1 })
      .limit(itemsPerPage)
      .skip(skip);

    const pageCount = Math.ceil(countItems / itemsPerPage);

    return res.status(200).json({
      pagination: {
        countItems,
        pageCount,
      },
      sortedItems,
    });
  } catch (err) {
    const error = new HttpError(
      'Failed to get sorted items, please try again.',
      500,
    );
    return next(error);
  }
}

module.exports = {
  createWishlistItem,
  getWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  sortWishlistItems,
};
