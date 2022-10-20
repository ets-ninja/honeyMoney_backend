const express = require('express');
const router = express.Router();
const basketController = require('../controllers/basket.controllers');
const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

router.get('/share-bank/:id', basketController.shareBasket);

router.get('/success/:param', (req, res) => {
  res.render('success');
});

router.get('/create-payment-intent', (req, res) => {
  res.render('paymentIntent')
})

router.post('/create-payment-intent', async (req, res) => {
  const items = req.body;

  console.log("items", items);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: items.amount,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    description: items.description,
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

module.exports = router;
