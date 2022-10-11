const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

async function instantPayout({ amount, destination }) {
  const payout = await stripe.payouts.create(
    {
      amount,
      currency: 'usd',
      method: 'instant',
    },
    {
      stripeAccount: destination,
    },
  );
  return payout.balance_transaction;
}

module.exports = { instantPayout };
