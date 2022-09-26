const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resetTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, expires: 120, default: Date.now },
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);
