const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controllers');

router.post('/setup_secret', paymentController.newSetupIntent );

router.post('/payment_secret', paymentController.newPaymentIntent );

router.post('/usercards', paymentController.getCustomerCards );

router.post('/userbalance', paymentController.getCustomerBalance )

router.post('/transaction_new', paymentController.newTransaction );

router.post('/transaction_history', paymentController.transactionsHistory);



module.exports = router;