const mongoose = require('mongoose');
const { Schema } = mongoose;

const shareBankTransactionSchema = new Schema(
  {
    basketId: {
      type: Schema.Types.ObjectId,
      ref: 'Basket',
      required: true,
    },
    stripeId: { type: String, required: true },
    amount: { type: Number, required: true },
    comment: { type: String, required: true, default: ' ' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('shareBankTransaction', shareBankTransactionSchema);
