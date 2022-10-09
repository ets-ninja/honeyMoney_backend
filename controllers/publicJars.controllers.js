const Basket = require('../models/basket.model');
const Participant = require('../models/participant.model');

async function getPublicJars(req, res, next) {
  const userId = req.user?._id;
  const participants = Participant.find({ user: userId });
  console.log(userId);
  console.log(participants);
  try {
    let JarsWithUsers = null;
    if (userId) {
      JarsWithUsers = await Basket.aggregate([
        { $match: { ownerId: { $ne: userId }, isPublic: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'user',
          },
        },
      ]);
    } else {
      JarsWithUsers = await Basket.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'user',
          },
        },
      ]);
    }

    res.status(200).json({
      JarsWithUsers: JarsWithUsers,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicJars,
};
