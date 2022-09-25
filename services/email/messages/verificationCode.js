const sendMessage = require('../message');

const sendVerificationCodeMessage = async (to, verificationCode) => {
  await sendMessage(
    to,
    'Restore password',
    './templates/verificationCode.hbs',
    { verificationCode },
  );
};

module.exports = sendVerificationCodeMessage;
