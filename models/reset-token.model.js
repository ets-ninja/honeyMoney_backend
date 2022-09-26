const mongoose = require('mongoose');
const { RESTORE_PASSWORD_EXPIRE } = require('../constants');

const Schema = mongoose.Schema;

const resetTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    expires: RESTORE_PASSWORD_EXPIRE,
    default: Date.now,
  },
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);
