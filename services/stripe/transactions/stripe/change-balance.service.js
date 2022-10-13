const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

// uses ONLY to change user`s transactions
async function changeBalance({ stripeUserId, amount, description }) {
  const balanceTransaction = await stripe.customers.createBalanceTransaction(
    stripeUserId,
    {
      amount,
      currency: 'usd',
      description,
    },
  );
  return balanceTransaction.id;
}

module.exports = { changeBalance };
