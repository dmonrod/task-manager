const sgMail = require("@sendgrid/mail");

const sendgridApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'daniemrodriguez@gmail.com',
    subject: 'Welcome!',
    text: `Welcome to the task app ${name}! We hope to see you use the app!`,
  });
  console.log("Welcome Mail sent to " + email);
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'daniemrodriguez@gmail.com',
    subject: 'Goodbye!',
    text: `We're sad to see you go ${name}!`,
  });
  console.log("Cancellation Mail sent to " + email);
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}