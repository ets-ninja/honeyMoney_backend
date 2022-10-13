const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const basketSchema = new Schema(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        goal: { type: Number, required: true },
        value: { type: Number, required: true },
        expirationDate: { type: Date },
        isPublic: { type: Boolean, required: true },
        image: { type: String }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Baskets', basketSchema);