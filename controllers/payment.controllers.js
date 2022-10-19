require('dotenv').config();
const logger = require('../services/logger');
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
const {
  createRefund,
} = require('../services/stripe/transactions/stripe/create-refund.service');

// entities
const Transaction = require('../models/transaction.model');
const Basket = require('../models/basket.model');
const User = require('../models/user.model');
const sendMessage = require('../services/notifications');

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
  } catch (err) {
    const error = new HttpError(
      'Could not find cards. Please add one first.',
      500,
    );
    return next(error);
  }
  if (connectedAccount) {
    const card = await getConnectedCard({ accountId: connectedAccount });
    cards.push(card);
  }
  return res.status(200).json(cards);
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
  const { amount, description, last4 } = req.body;

  let paymentMethods;
  try {
    paymentMethods = await stripe.customers.listPaymentMethods(stripeUserId, {
      type: 'card',
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Could not find your card. Please try again later',
      500,
    );
    return next(error);
  }

  const paymentMethod = paymentMethods.data.find(
    method => method.card.last4 === last4,
  )?.id;
  if (!paymentMethod) {
    const error = new HttpError(
      "You don't have a card with this number. Please try again later",
      500,
    );
    return next(error);
  }

  let payment_secret = {};
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeUserId,
      amount: amount,
      description: description,
      currency: 'usd',
      payment_method: paymentMethod,
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
  const { _id, firstName, lastName } = req.user;
  const { paymentIntentId, basketId } = req.body;

  let basket;
  try {
    basket = await Basket.findOne({ _id: basketId });
  } catch (err) {
    createRefund({ paymentIntentId });
    const error = new HttpError(
      'Could find basket. Please try again later',
      500,
    );
    return next(error);
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    createRefund({ paymentIntentId });
    const error = new HttpError(
      'Could find payment. Please try again later',
      500,
    );
    return next(error);
  }

  // send money to basket
  try {
    await changeBalance({
      stripeUserId: basket.stripeId,
      amount: `-${paymentIntent.amount}`,
      description: paymentIntent.description,
    });
  } catch (err) {
    createRefund({ paymentIntentId });
    console.log(err);
    const error = new HttpError(
      'Could not create transactions. Please try again later',
      500,
    );
    return next(error);
  }

  // change basket value
  let value = paymentIntent.amount / 100;
  try {
    basket.value += value;
    await basket.save();
  } catch (err) {
    createRefund({ paymentIntentId });
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
      userId: _id,
      stripeId: paymentIntent.id,
      amount: paymentIntent.amount,
      comment: paymentIntent.description,
      card: paymentIntent.charges.data[0].payment_method_details.card.last4,
    });
    await newTransaction.save();
  } catch (err) {
    createRefund({ paymentIntentId });
    const error = new HttpError(
      'Could not create transactions. Please try again later',
      500,
    );
    return next(error);
  }

  let owner;
  try {
    owner = await User.findOne({ _id: basket.ownerId });
  } catch (error) {
    logger.error('Cant send Notification');
  }

  if (owner?.notificationTokens) {
    try {
      await sendMessage(
        owner.notificationTokens,
        {
          clickAction: `${process.env.APP_URL}/basket/${basketId}`,
        },
        {
          title: `${firstName} ${lastName}`,
          body: `${paymentIntent.amount / 100}$ on ${basket.name}`,
          image:
            'https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg',
        },
      );
    } catch (err) {
      logger.error('Cant send Notification');
    }
  }

  res.status(201).json({ mes: 'Donate successful' });
}

// get list of transactions
async function userTransactionsHistory(req, res, next) {
  const { _id } = req.user;
  let transactions;
  try {
    transactions = await Transaction.find({ userId: _id });
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
  const { connectedAccount } = req.user;
  const { basketId } = req.body;

  let basket;
  try {
    basket = await Basket.findOne({
      _id: basketId,
      ownerId: req.user._id,
    });
  } catch (err) {
    const error = new HttpError(
      'Could not find this basket. Please try again later.',
      500,
    );
    return next(error);
  }

  // some verification
  if (!basket.ownerId.equals(req.user._id)) {
    const error = new HttpError('Could not find your basket with this id', 500);
    return next(error);
  }

  const amount = basket.value;
  if (amount !== basket.goal) {
    const error = new HttpError('Basket is not full yet.', 500);
    return next(error);
  }
  if (!connectedAccount) {
    const error = new HttpError(
      'You should add an account to hold money first.',
      500,
    );
    return next(error);
  }

  const amountInDollars = amount * 100;
  let transfer;
  try {
    transfer = await createTransfer({
      amount: amountInDollars,
      destination: connectedAccount,
    });
  } catch (err) {
    const error = new HttpError(
      'Could not create transfer. Please try again later.',
      500,
    );
    return next(error);
  }

  try {
    await instantPayout({
      amount: amountInDollars,
      destination: connectedAccount,
    });
  } catch (err) {
    new HttpError(
      "Sorry, your country doesn't support instant payouts. Stripe will send your funds to your bank account within a few days.",
      500,
    );
  }

  try {
    await changeBalance({
      stripeUserId: basket.stripeId,
      amount: amountInDollars,
      description: `Payouts from ${basket.name}`,
    });
  } catch (err) {
    const error = new HttpError(
      'Could not send funds. Please try again later.',
      500,
    );
    return next(error);
  }

  let paymentMethod;
  try {
    paymentMethod = await getConnectedCard({ accountId: connectedAccount });
  } catch (err) {
    const error = new HttpError(
      'Could find your card to send funds. Please try again later.',
      500,
    );
    return next(error);
  }

  try {
    basket.value -= amount;
    await basket.save();
  } catch (err) {
    const error = new HttpError(
      'Could find your card to send funds. Please try again later.',
      500,
    );
    return next(error);
  }

  try {
    const transaction = await createTransaction({
      basketId: basket._id,
      userId: req.user._id,
      stripeId: transfer,
      amount: amount,
      comment: `Payouts from ${basket.name}`,
      card: paymentMethod.last4,
    });
    res.status(200).json(transaction.status);
  } catch (err) {
    const error = new HttpError(
      'Could not create transaction. Please try again later.',
      500,
    );
    return next(error);
  }
}

async function createConnectedAccount(req, res, next) {
  const { _id } = req.user;

  let currentUser;
  try {
    currentUser = await User.findOne({ _id: _id });
  } catch (err) {
    const error = new HttpError(
      'Could not create an account. Please try again later.',
      500,
    );
    return next(error);
  }

  if (currentUser.connectedAccount) {
    const error = new HttpError('You already have an account', 500);
    return next(error);
  }

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
    { _id: req.user._id },
    { connectedAccount: connectedAccount.id },
  );

  let accountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: connectedAccount.id,
      refresh_url: `${process.env.APP_URL}/profile`, //redirect if link is expired
      return_url: `${process.env.APP_URL}/profile`, //redirect after completing flow
      type: 'account_onboarding',
    });
    console.log(accountLink);
  } catch (err) {
    const error = new HttpError(
      'Could not register you now. Please try again later.',
      500,
    );
    return next(error);
  }
  res.status(200).json(accountLink.url);
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
