const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const basketSchema = new Schema({
    basketName: {type: String, required: true},
    description: {type: String, required: false},
    moneyGoal: {type: Number, required: true},
    expirationDate: {type: Number, required: false}, //? expiration date
    isPublic: {type: Boolean, required: true},
    createdAt: {type: Number, required: true},
    currentValue: {type: Number, required: false, default: 0},
    // userId + Image 
});

module.exports = mongoose.model('baskets', basketSchema);
