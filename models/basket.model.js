const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const basketSchema = new Schema(
    {
        ownerId: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        goal: { type: Number, required: true },
        value: { type: Number, required: true },
        expirationDate: { type: Date, required: true },
        isPublic: { type: Boolean, required: true },
        isHot: { type: Boolean, default: false },
        creationDate: { type: Date, required: true },
        image: { type: Buffer }
    }
)
/*.plugin(function(schema, options) {
    schema.pre('save', function(next) {
        this.status.isHot = (new Date(Date.parse(this.status.expirationDate) - Date.now()).getDate() < 7);
        next();
    })
})*/

module.exports = mongoose.model('Baskets', basketSchema);