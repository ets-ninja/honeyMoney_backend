const mongoose = require('mongoose');
const { Schema } = mongoose;

//sreated at
//description
//amount
//type - balance or card
//bankaId
//user id
//balance transactions - only gift or transactions when we pay from banka to client
const transactionSchema = new Schema({
    // bankId:{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Banka',
    //     required: true,
    // },
    userId:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionId:{ type: String, required: true },
    amount: { type: Number, required: true },
    comment: { type: String, required: true, default: '' },
    type: {type: String, enum:['balance', 'card']}
})



module.exports = mongoose.model('Transaction', transactionSchema);