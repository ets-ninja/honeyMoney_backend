require('dotenv').config();
const HttpError = require('../utils/http-error');

const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

// get customer balance
async function getCustomerBalance(req, res, next) {
  const { stripeUserId } = req.user;
  let balance;
  try {
    const customer = await stripe.customers.retrieve(stripeUserId);
    balance = customer.balance;
  } catch (err) {
    const error = new HttpError('Could not find customer.', 500);
    return next(error);
  }
  return res.status(200).json(balance);
}

// get customer cards info
async function getCustomerCards(req, res, next) {
  const { stripeUserId } = req.user;
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

// payment from customer - one payment session - "donate" button
async function newPaymentIntent(req, res, next) {
  const { stripeUserId } = req.user;
  const { amount, description } = req.body;
  let payment_secret = {};
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeUserId,
      amount: amount,
      currency: 'usd',
      description: description,
      automatic_payment_methods: { enabled: true },
    });
    payment_secret = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    };
  } catch (err) {
    const error = new HttpError(
      'Could not create payment. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(201).json(payment_secret);
}

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
  const { stripeUserId } = req.user;
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

module.exports = {
  getCustomerBalance,
  getCustomerCards,
  newSetupIntent,
  newPaymentIntent,
  newTransaction,
  transactionsHistory,
};
