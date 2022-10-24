const express = require('express');
const router = express.Router();
const jarController = require('../controllers/jar.controllers');

router.get('/share-bank/:id', jarController.shareBasket);

router.get('/success/:param', (req, res) => {
  res.render('success');
});

router.get('/error', (req, res) => {
  res.render('error')
})

router.get('/create-payment-intent', (req, res) => {
  res.render('paymentIntent');
});

module.exports = router;
