const mongoose = require('mongoose');
const { Schema } = mongoose;

const donateSchema = new Schema(
  {
    basketId: {
      type: Schema.Types.ObjectId,
      ref: 'Basket',
      required: true,
    },
    stripeId: { type: String, required: true },
    amount: { type: Number, required: true },
    comment: { type: String, required: true, default: '' },
    card: { type: Number },
    // type: {type: String, enum:['balance', 'card']},
    status: { type: String, required: true, enum: ['succeeded', 'canceled'] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Donate', donateSchema);
