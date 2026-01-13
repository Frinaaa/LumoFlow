const nodemailer = require('nodemailer');
const path = require('path');

// 🟢 FORCE LOAD .env here to ensure variables are never undefined
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sendEmail = async (options) => {
  // DEBUG CHECK: This will show in your terminal
  console.log("--- 📧 SMTP CREDENTIAL CHECK ---");
  console.log("Email from .env:", process.env.SMTP_EMAIL || "❌ NOT FOUND");
  console.log("Pass from .env:", process.env.SMTP_PASSWORD ? "✅ LOADED (HIDDEN)" : "❌ NOT FOUND");

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,    // modesty.ayah@gmail.com
        pass: process.env.SMTP_PASSWORD, // pfpnndlpiwpuordx
      },
    });

    const mailOptions = {
      from: `"LumoFlow AI" <${process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: `
        <div style="background-color: #050508; color: #fff; padding: 30px; font-family: sans-serif; border: 1px solid #bc13fe;">
          <h2 style="color: #00f2ff;">LumoFlow Recovery</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #bc13fe; letter-spacing: 5px;">${options.code}</h1>
          <p style="color: #666; font-size: 12px;">Expires in 10 minutes.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ SUCCESS: Email sent to", options.email);
    return info;

  } catch (error) {
    console.error("❌ SMTP ERROR:", error.message);
    throw error;
  }
};

module.exports = sendEmail;