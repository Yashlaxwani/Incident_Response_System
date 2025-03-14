const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create reusable transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email sent: ${info.messageId}`);
};

module.exports = sendEmail;