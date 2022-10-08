const stripe = require('stripe')(process.env.STRIPE_SK_TEST);

async function createCustomer({ email, firstName, lastName }) {
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
  });

  return customer.id;
}

module.exports = { createCustomer };
