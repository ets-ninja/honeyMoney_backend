const sendMessage = require('../message');

const { EMAIL_EXPIRE } = require('../../../constants');

const sendConfirmEmailMessage = async (to, { username, code }) => {
  const valid_hours = (EMAIL_EXPIRE / 3600).toFixed(1);
  return await sendMessage(
    to,
    'Restore password',
    './templates/restorePassword.hbs',
    {
      email: to,
      username,
      code,
      valid_hours,
    },
  );
};

module.exports = sendConfirmEmailMessage;
