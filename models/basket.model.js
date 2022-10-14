const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const basketSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: false },
  goal: { type: Number, required: true },
  value: { type: Number, required: true },
  expirationDate: { type: Number, required: false },
  isPublic: { type: Boolean, required: true },
  creationDate: { type: Number, required: true },
  image: { type: String },
  stripeId: {type: String, required: true }
});

module.exports = mongoose.model('Basket', basketSchema);