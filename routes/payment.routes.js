const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controllers');

router.post('/secret', paymentController.setupFuturePayments );

router.post('/cards', paymentController.getCustomerCards );

router.post('/transaction', paymentController.newTransaction );

router.post('/transactions', paymentController.getTransactions );


module.exports = router;