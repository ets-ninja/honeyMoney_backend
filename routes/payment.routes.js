const express = require('express');
const router = express.Router();
const passport = require('passport');

const paymentController = require('../controllers/payment.controllers');

router.get(
  '/userbalance',
  passport.authenticate('jwt', { session: false }),
  paymentController.getCustomerBalance,
);

router.get(
  '/usercards',
  passport.authenticate('jwt', { session: false }),
  paymentController.getCustomerCards,
);

router.post(
  '/setup_secret',
  passport.authenticate('jwt', { session: false }),
  paymentController.newSetupIntent,
);

router.post(
  '/payment_secret',
  passport.authenticate('jwt', { session: false }),
  paymentController.newPaymentIntent,
);

router.post(
  '/donate',
  passport.authenticate('jwt', { session: false }),
  paymentController.sendMoneyToBasket,
);

router.get(
  '/user_transaction_history',
  passport.authenticate('jwt', { session: false }),
  paymentController.userTransactionsHistory,
);

router.post(
  '/recieve_money',
  passport.authenticate('jwt', { session: false }),
  paymentController.receiveMoney,
);

router.post(
  '/create_conn_account',
  passport.authenticate('jwt', { session: false }),
  paymentController.createConnectedAccount,
);

router.get('/req', (req, res, next) => {
  console.log(req);
});

module.exports = router;
