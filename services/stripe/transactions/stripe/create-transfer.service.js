const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

// destination is a user`s connected account`s id
async function createTransfer({ amount, destination }) {
  const transfer = await stripe.transfers.create({
    amount,
    destination,
    currency: 'usd',
  });

  return transfer.balance_transaction;
}

module.exports = { createTransfer };
