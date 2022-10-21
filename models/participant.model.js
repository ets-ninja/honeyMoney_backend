const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const participantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    basket: { type: Schema.Types.ObjectId, ref: 'Baskets', required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Participants', participantSchema);
