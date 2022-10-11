const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

async function getConnectedCard({ accountId }){
    const account = await stripe.accounts.retrieve(
        accountId
    );
    return {
        id: account.external_accounts.data.id,
        brand: account.external_accounts.data.id,
        country: account.external_accounts.data.country,
        exp_month: account.external_accounts.data.exp_month,
        exp_year: account.external_accounts.data.exp_year,
        last4: account.external_accounts.data.last4,
    }
}

module.exports = {getConnectedCard}