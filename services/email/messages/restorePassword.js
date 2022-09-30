const sendMessage = require('../message');

const { RESTORE_PASSWORD_EXPIRE } = require('../../../constants');

const sendRestorePasswordMessage = async (to, { username, link }) => {
  const valid_hours = (RESTORE_PASSWORD_EXPIRE / 3600).toFixed(1);
  return await sendMessage(
    to,
    'Restore password',
    './templates/restorePassword.hbs',
    {
      email: to,
      username,
      link,
      valid_hours,
    },
  );
};

module.exports = sendRestorePasswordMessage;
