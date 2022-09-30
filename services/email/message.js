const transporter = require('./index');
const handlebars = require('handlebars');
const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

const sendMessage = async (to, emailSubject, pathToTemplate, templateData) => {
  let dummyTemplate;
  try {
    dummyTemplate = fs.readFileSync(
      path.join(__dirname, pathToTemplate),
      'utf8',
    );
  } catch (error) {
    throw new Error(error);
  }

  const template = handlebars.compile(dummyTemplate);

  const mjml = template(templateData);
  const { html } = mjml2html(mjml);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_LOGIN,
      to: to,
      subject: emailSubject,
      html: html,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = sendMessage;
