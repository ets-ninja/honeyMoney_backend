require('dotenv').config();
const HttpError = require('../utils/http-error');

const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

//services
const {
  createTransaction,
} = require('../services/stripe/transactions/custom/create-transaction.service');
const {
  createTransfer,
} = require('../services/stripe/transactions/stripe/create-transfer.service');
const {
  instantPayout,
} = require('../services/stripe/transactions/stripe/instant-payout.service');
const {
  changeBalance,
} = require('../services/stripe/transactions/stripe/change-balance.service');
const {
  getConnectedCard,
} = require('../services/stripe/get-connected-account.services');

// entities
const Transaction = require('../models/transaction.model');
const Jar = require('../models/jar.model');
const User = require('../models/user.model');

// get customer balance
async function getCustomerBalance(req, res, next) {
  const { stripeUserId } = req.user;
  let balance;
  try {
    const customer = await stripe.customers.retrieve(stripeUserId);
    balance = customer.balance / -100;
  } catch (err) {
    const error = new HttpError('Could not find customer.', 500);
    return next(error);
  }
  return res.status(200).json(balance);
}

// get customer cards info
async function getCustomerCards(req, res, next) {
  const { stripeUserId, connectedAccount } = req.user;
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
    if (connectedAccount) {
      const card = await getConnectedCard({ accountId: connectedAccount });
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

// set up future payments for customer (add card)
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
  const { stripeUserId, email } = req.user;
  const { amount, description, paymentMethod } = req.body;
  let payment_secret = {};
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeUserId,
      amount: amount,
      description: description,
      currency: 'usd',
      payment_method: paymentMethod,
      //   automatic_payment_methods: { enabled: true },
      confirm: true,
      off_session: true,
      receipt_email: email,
    });
    payment_secret = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    };
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Could not create payment. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(201).json(payment_secret);
}

// calls when payment intent succeeded maybe shoud be merged with PaymentIntent func
async function sendMoneyToBasket(req, res, next) {
  const { id } = req.user;
  const { paymentIntentId, basketId } = req.body;

  const basket = await Jar.findOne({ _id: basketId });
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // send money to basket
  try {
    await changeBalance({
      stripeUserId: basket.stripeId,
      amount: `-${paymentIntent.amount}`,
      description: paymentIntentId.description,
    });
  } catch (err) {
    const error = new HttpError(
      'Could not create transactions. Please try again later',
      500,
    );
    return next(error);
  }

  // custom transaction
  try {
    const newTransaction = await createTransaction({
      basketId,
      userId: id,
      stripeId: paymentIntent.id,
      amount: paymentIntent.amount,
      comment: paymentIntent.description,
      card: paymentIntent.charges.data[0].payment_method_details.card.last4,
    });
    await newTransaction.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Could not create transactions. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(201).json({ mes: 'Donate successful' });
}

// get list of transactions
async function userTransactionsHistory(req, res, next) {
  const { id } = req.user;
  let transactions;
  try {
    transactions = await Transaction.find({ userId: id });
  } catch (err) {
    const error = new HttpError(
      'Could not find transactions. Please try again later',
      500,
    );
    return next(error);
  }
  res.status(200).json(transactions);
}

async function receiveMoney(req, res, next) {
  try {
    const { id, connectedAccount } = req.user;
    const { basketId, basket_name } = req.body;

    const basket = await Jar.findOne({ balance_id: basketId });
    // some verification
    if (id !== basket.ownerId) {
      const error = new HttpError(
        'Could not find your basket with this id',
        500,
      );
      return next(error);
    }
    const amount = basket.value;
    if (amount !== basket.goal) {
      const error = new HttpError('Basket is not full yet', 500);
      return next(error);
    }
    if (!connectedAccount) {
      const error = new HttpError(
        'You should add an account to hold money fisrt',
        500,
      );
      return next(error);
    }

    const transfer = await createTransfer({
      amount,
      destination: connectedAccount,
    });
    if (!transfer) {
      const error = new HttpError(
        'Could not send funds. Please try again later.',
        500,
      );
      return next(error);
    }
    await instantPayout({ amount, destination: connectedAccount });
    const balance = await changeBalance({ stripeUserId: basketId, amount });
    if (!balance) {
      const error = new HttpError(
        'Could not send funds. Please try again later.',
        500,
      );
      return next(error);
    }
    const paymentMethod = await getConnectedCard('connectedAccount');
    const transaction = await createTransaction({
      basketId: basket._id,
      userId: id,
      stripeId: transfer,
      amount: amount,
      comment: `Payouts from ${basket_name}`,
      paymentMethod: paymentMethod,
    });
    res.status(200).json(transaction);
  } catch (err) {
    const error = new HttpError(
      'Could not send funds. Please try again later.',
      500,
    );
    return next(error);
  }
}

async function createConnectedAccount(req, res, next) {
  const { reauthLink, returnLink } = req.body;
  let connectedAccount;
  try {
    connectedAccount = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
    });
  } catch (err) {
    const error = new HttpError(
      'Could not create account. Please try again later.',
      500,
    );
    return next(error);
  }

  await User.findOneAndUpdate(
    { _id: req.user.id },
    { connectedAccount: connectedAccount.id },
  );

  let accountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: connectedAccount.id,
      refresh_url: reauthLink, //redirect if link is expired
      return_url: returnLink, //redirect after completing flow
      type: 'account_onboarding',
    });
  } catch (err) {
    const error = new HttpError(
      'Could not register you now. Please try again later.',
      500,
    );
    return next(error);
  }
  res.status(200).json(accountLink);
}

module.exports = {
  getCustomerBalance,
  getCustomerCards,
  newSetupIntent,
  newPaymentIntent,
  userTransactionsHistory,
  receiveMoney,
  createConnectedAccount,
  sendMoneyToBasket,
};
