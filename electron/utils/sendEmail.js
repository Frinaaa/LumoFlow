const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter (Configure this in your .env file later)
  // For Gmail, you often need an "App Password"
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
      user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
      pass: process.env.SMTP_PASSWORD || 'your-app-password',
    },
  });

  // 2. Define Email Options
  const message = {
    from: `${process.env.FROM_NAME || 'LumoFlow AI'} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `
      <div style="font-family: sans-serif; background: #050508; color: #fff; padding: 20px;">
        <h1 style="color: #00f2ff;">LumoFlow Password Reset</h1>
        <p>You requested a password reset. Please use the code below:</p>
        <h2 style="color: #bc13fe; letter-spacing: 5px;">${options.code}</h2>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  };

  // 3. Send
  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;