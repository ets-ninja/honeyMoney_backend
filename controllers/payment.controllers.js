require('dotenv').config();
const HttpError = require('../utils/http-error');

const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

// get customer balance
async function getCustomerBalance(req, res, next) {
  const { stripeUserId } = req.user;
  let balance;
  try {
    const customer = await stripe.customers.retrieve(stripeUserId);
    balance = customer.balance/(-100);
  } catch (err) {
    const error = new HttpError('Could not find customer.', 500);
    return next(error);
  }
  return res.status(200).json(balance);
}

// get customer cards info
async function getCustomerCards(req, res, next) {
  const { stripeUserId } = req.body;
  let cards = [];
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      stripeUserId,
      { type: 'card' },
    );

    for (let i = 0; i < paymentMethods.data.length; i++) {
      const card = {
        id: paymentMethods.data[i].id,
        brand: paymentMethods.data[i].card.brand,
        country: paymentMethods.data[i].card.country,
        exp_month: paymentMethods.data[i].card.exp_month,
        exp_year: paymentMethods.data[i].card.exp_year,
        last4: paymentMethods.data[i].card.last4,
      };
      cards.push(card);
    }
    return res.status(200).json(cards);
  } catch (err) {
    const error = new HttpError(
      'Could not find cards. Please add one first.',
      500,
    );
    return next(error);
  }
}

// set up future payments for customer
async function newSetupIntent(req, res, next) {
  const { stripeUserId } = req.user;
  let setupIntent;
  try {
    // returns client secret
    setupIntent = await stripe.setupIntents.create({
      customer: stripeUserId,
      payment_method_types: ['card'],
    });
  } catch (err) {
    const error = new HttpError(
      'Could not save card. Please try again later',
      500,
    );
    return next(error);
  }
  res
    .status(201)
    .json({ id: setupIntent.id, client_secret: setupIntent.client_secret });
}

// async function listSetupIntents(req, res, next){
//     try{
//         const {stripeUserId} = req.body
//         const setupIntents = await stripe.setupIntents.list({
//             customer: stripeUserId,
//           });

//           res.status(201).json(setupIntents);
//     }catch(err){
//         console.log(err)
//     }
// }

// payment from customer - one payment session - "donate" button
async function newPaymentIntent(req, res, next) {
  const { stripeUserId } = req.user;
  const { amount, description } = req.body;
  let payment_secret = {};
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeUserId,
      amount,
      description,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });
    payment_secret = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    };
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      'Could not create payment. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(201).json(payment_secret);
}

// async function listPaymentsIntents(req, res, next){
//     try{
//         const {stripeUserId} = req.body
//         const paymentIntents = await stripe.paymentIntents.list({
//             customer: stripeUserId
//         });
//         res.status(201).json(paymentIntents);
//     }catch(err){
//         console.log(err)
//     }
// }

// change customer balance
async function newTransaction(req, res, next) {
  const { stripeUserId } = req.user;
  const { amount, description } = req.body;
  let balanceTransaction;
  try {
    balanceTransaction = await stripe.customers.createBalanceTransaction(
      stripeUserId,
      {
        amount: amount,
        currency: 'usd',
        description: description,
      },
    );
  } catch (err) {
    const error = new HttpError(
      'Could not make a transaction. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(201).json({
    id: balanceTransaction.id,
    ending_balance: balanceTransaction.ending_balance,
  });
}

// get list of transactions
async function transactionsHistory(req, res, next) {
  const { stripeUserId } = req.body;
  let transHistory = [];
  try {
    const transactions = await stripe.customers.listBalanceTransactions(
      stripeUserId,
    );
    for (let i = 0; i < transactions.data.length; i++) {
      const transaction = {
        id: transactions.data[i].id,
        amount: transactions.data[i].amount,
        description: transactions.data[i].description,
        ending_balance: transactions.data[i].ending_balance,
        exp_year: transactions.data[i].exp_year,
      };
      transHistory.push(transaction);
    }
  } catch (err) {
    const error = new HttpError(
      'Could not find transactions. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(200).json(transHistory);
}


// async function createFinancialAccount(req, res, next){
//     try{
//         const account = await stripe.accounts.create({
//             country: 'US',
//             type: 'custom',
//             capabilities: {card_payments: {requested: true}, transfers: {requested: true}},
//           });
//     }catch(err){
//         console.log(err)
//     }
// }

// async function createFinancialSession(req, res, next){
//     try{
//         const {stripeUserId} = req.body
//         const session = await stripe.financialConnections.sessions.create({
//             account_holder: {
//             type: 'customer',
//             customer: stripeUserId,
//             },
//             permissions: ['payment_method', 'balances', 'transactions', 'ownership'],
//             filters: {countries: ['US']},
//         });
//         res.status(200).json(session.client_secret);
//     }catch(err){
//         console.log(err)
//     }
// }

// async function refreshBalance(req, res, next){
//     try{
//         const {finAcc} = req.body
//         const account = await stripe.financialConnections.accounts.refresh(
//             finAcc,
//         {features: ['balance']}
//       );
//         // const balance = await stripe.financialConnections.accounts.retrieve(
//         //     account.id
//         // );
//       res.status(200).json(account);
//     }catch(err){
//         console.log(err)
//     }
// }



module.exports = {
  getCustomerBalance,
  getCustomerCards,
  newSetupIntent,
  newPaymentIntent,
  newTransaction,
  transactionsHistory,
};
