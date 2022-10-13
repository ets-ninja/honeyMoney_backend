const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

async function getConnectedCard({ accountId }) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    id: account.external_accounts.data.id,
    brand: account.external_accounts.data[0].brand,
    country: account.external_accounts.data[0].country,
    exp_month: account.external_accounts.data[0].exp_month,
    exp_year: account.external_accounts.data[0].exp_year,
    last4: account.external_accounts.data[0].last4,
  };
}

module.exports = { getConnectedCard };
