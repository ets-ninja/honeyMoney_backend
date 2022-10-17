const Transaction = require('../../../../models/transaction.model');

async function createTransaction({
  basketId,
  userId,
  stripeId,
  amount,
  comment,
  card,
}) {
  const transaction = new Transaction({
    basketId,
    userId,
    stripeId,
    amount,
    comment,
    card,
    status: 'succeeded',
  });
  return transaction;
}

module.exports = { createTransaction };
