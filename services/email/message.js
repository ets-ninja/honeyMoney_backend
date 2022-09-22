const transporter = require("./index");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const sendMessage = async (to, emailSubject, pathToTemplate, templateData) => {
    let dummyTemplate;
    try {
        dummyTemplate = fs.readFileSync(
            path.join(__dirname, pathToTemplate),
            "utf8"
        );
    } catch (error) {
        throw new Error(error);
    }

    const template = handlebars.compile(dummyTemplate);

    const htmlToSend = template(templateData);

    let message;
    try {
        message = await transporter.sendMail({
            from: process.env.EMAIL_LOGIN,
            to: to,
            subject: emailSubject,
            html: htmlToSend,
        });
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = sendMessage;
