const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

async function createRefund({ paymentIntentId }) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });

  return refund.id;
}

module.exports = { createRefund };
