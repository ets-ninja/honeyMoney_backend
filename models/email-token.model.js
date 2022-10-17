const mongoose = require('mongoose');
const { EMAIL_EXPIRE } = require('../constants');

const Schema = mongoose.Schema;

// Token for restore password / confirm email
const emailTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    expires: EMAIL_EXPIRE,
    default: Date.now,
  },
});

module.exports = mongoose.model('EmailToken', emailTokenSchema);
