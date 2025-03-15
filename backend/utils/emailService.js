const nodemailer = require("nodemailer")

const sendEmail = async (options) => {
  try {
    // Create reusable transporter
    let transporter

    if (process.env.NODE_ENV === "development") {
      // Use ethereal for development
      const testAccount = await nodemailer.createTestAccount()

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    } else {
      // Use configured email service for production
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    }

    // Define email options
    const mailOptions = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent: ${info.messageId}`)

    // Log preview URL in development
    if (process.env.NODE_ENV === "development") {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return info
  } catch (error) {
    console.error("Email sending error:", error)
    throw new Error("Email could not be sent")
  }
}

module.exports = sendEmail

