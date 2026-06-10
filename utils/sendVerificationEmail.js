const { Resend } = require("resend");
require("dotenv").config();
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async ({ name, email, verificationCode }) => {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Hello ${name}</h2>
      <p>Your verification code is:</p>
      <h1>${verificationCode}</h1>
      <p>Expires in 10 minutes</p>
    `,
  });
};

module.exports = sendVerificationEmail;
