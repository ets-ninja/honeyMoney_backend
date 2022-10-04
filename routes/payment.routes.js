const express = require('express');
const router = express.Router();
const passport = require('passport');

const paymentController = require('../controllers/payment.controllers');

router.post(
  '/setup_secret',
//   passport.authenticate('jwt', { session: false }),
  paymentController.newSetupIntent,
)

router.get(
    '/cancel_setup',
    // passport.authenticate('jwt', { session: false }),
    paymentController.cancelSetupIntent,
  )

router.get(
    '/list_setup',
    // passport.authenticate('jwt', { session: false }),
    paymentController.listSetupIntents,
  )

router.post(
  '/payment_secret',
  passport.authenticate('jwt', { session: false }),
  paymentController.newPaymentIntent,
);

router.get(
  '/usercards',
  passport.authenticate('jwt', { session: false }),
  paymentController.getCustomerCards,
);

router.get(
  '/userbalance',
  passport.authenticate('jwt', { session: false }),
  paymentController.getCustomerBalance,
);

router.post(
  '/transaction_new',
  passport.authenticate('jwt', { session: false }),
  paymentController.newTransaction,
);

router.get(
  '/transaction_history',
  passport.authenticate('jwt', { session: false }),
  paymentController.transactionsHistory,
);

router.get(
    '/gift',
    passport.authenticate('jwt', { session: false }),
    paymentController.giftDollar,
  );

module.exports = router;
