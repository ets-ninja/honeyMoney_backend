const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    publicName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userPhoto: { type: String, default: '' },
    //   stripeUserId: { type: String, required: true },
  },
  { timestamps: true },
);

userSchema.plugin(uniqueValidator);
if (!userSchema.options.toObject) userSchema.options.toObject = {};
// eslint-disable-next-line no-unused-vars
userSchema.options.toObject.transform = function (doc, ret, options) {
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  return ret;
};

module.exports = mongoose.model('User', userSchema);
