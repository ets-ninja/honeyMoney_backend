const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistItemSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    description: {
      type: String,
      maxLength: 1000,
      default: '',
    },
    finalGoal: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('WishlistItem', wishlistItemSchema);
