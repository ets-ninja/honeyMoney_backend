const sendMessage = require("../message");

const sendRestorePasswordMessage = async (to, restoreLink) => {
    await sendMessage(
        to,
        "Restore password",
        "./templates/restorePassword.hbs",
        { restoreLink }
    );
};

module.exports = sendRestorePasswordMessage;
