require('dotenv').config();
const HttpError = require('../utils/http-error');

const stripe = require('stripe')(process.env.STRIPE_SK_TEST)


// get customer balance
async function getCustomerBalance(req, res, next){
    try{
        const { stripeUserId } = req.body;
        // code
    }catch(err){
        const error = new HttpError(
          'Could not find customer.',
          500,
        );
        return next(error);
    }
}


// get customer cards info
async function getCustomerCards(req, res, next){
    const { stripeUserId } = req.body;
    let cards = [];
    
    try{
        const paymentMethods = await stripe.customers.listPaymentMethods(
          stripeUserId,
          {type: 'card'}
        );
        
        for(let i = 0; i < paymentMethods.data.length; i++){
            const card = {
                id: paymentMethods.data[i].id,
                brand: paymentMethods.data[i].card.brand,
                country: paymentMethods.data[i].card.country,
                exp_month: paymentMethods.data[i].card.exp_month,
                exp_year: paymentMethods.data[i].card.exp_year,
            }
            cards.push(card)
        }
        return res
                .status(200)
                .json(cards);
    }catch(err){
        const error = new HttpError(
          'Could not find payments methods. Please add one first.',
          500,
        );
        return next(error);
    }
}

// set up future payments for customer
async function setupFuturePayments(req, res, next){
    try{
        const { stripeUserId } = req.body;
        // returns client secret
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeUserId,
            payment_method_types: ['card'],
          });

          res
            .status(200)
            .json({ id: setupIntent.id, client_secret: setupIntent.client_secret });

    }catch(err){
        const error = new HttpError(
          'Could not save card. Please try again later',
          500,
        );
        return next(error);
    }
}

// get money from cutomers balance
async function newPayment(req, res, next){
    try{
        
    }catch(err){
        const error = new HttpError(
          'Could not save card. Please try again later',
          500,
        );
        return next(error);
    }
}

// change customer balance
async function newTransaction(req, res, next){
    try{
        const { stripeUserId, amount, description } = req.body;
        const balanceTransaction = await stripe.customers.createBalanceTransaction(
            stripeUserId,
            {
                amount: amount, 
                currency: 'usd',
                description: description
            }
      );
      res
        .status(200)
        .json({ id: balanceTransaction.id, ending_balance: balanceTransaction.ending_balance });
        
    }catch(err){
        const error = new HttpError(
          'Could not save card. Please try again later',
          500,
        );
        return next(error);
    }
}

// get transactions
async function getTransactions(req, req, next){
    try{
        const { stripeUserId } = req.body;
        // limit = limit === undefined ? 10 : limit
        const transactions = await stripe.customers.listBalanceTransactions(stripeUserId);
        
      res
      .status(200)
      .json( transactions );

    }catch(err){
        const error = new HttpError(
          'Could get transactions. Please try again later',
          500,
        );
        return next(error);
    }
}



module.exports = { getCustomerCards, setupFuturePayments, newTransaction, getTransactions };