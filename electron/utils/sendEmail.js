const nodemailer = require('nodemailer');
const path = require('path');

// 🟢 FORCE LOAD .env here to ensure variables are never undefined
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sendEmail = async (options) => {
  console.log("\n========== 📧 EMAIL SENDING INITIATED ==========");
  console.log("Recipient:", options.email);
  console.log("Subject:", options.subject);
  console.log("Code:", options.code);
  
  // DEBUG CHECK: This will show in your terminal
  console.log("\n--- 📧 SMTP CREDENTIAL CHECK ---");
  console.log("SMTP Host:", process.env.SMTP_HOST || "❌ NOT FOUND");
  console.log("SMTP Port:", process.env.SMTP_PORT || "❌ NOT FOUND");
  console.log("SMTP Email:", process.env.SMTP_EMAIL || "❌ NOT FOUND");
  console.log("SMTP Password:", process.env.SMTP_PASSWORD ? "✅ LOADED (HIDDEN)" : "❌ NOT FOUND");
  console.log("FROM_NAME:", process.env.FROM_NAME || "LumoFlow (default)");

  // Validate credentials exist
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    const error = new Error('SMTP credentials not configured in .env file');
    console.error("❌ CONFIGURATION ERROR:", error.message);
    throw error;
  }

  try {
    console.log("\n📧 Creating SMTP transporter...");
    
    // Use host/port configuration instead of service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      logger: true,
      debug: true,
    });

    console.log("📧 Attempting to verify SMTP connection...");
    
    // Verify connection
    const verified = await transporter.verify();
    console.log("✅ SMTP connection verified:", verified);

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'LumoFlow'}" <${process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: `
        <div style="background-color: #050508; color: #fff; padding: 30px; font-family: sans-serif; border: 1px solid #bc13fe;">
          <h2 style="color: #00f2ff;">LumoFlow Recovery</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #bc13fe; letter-spacing: 5px; font-size: 32px;">${options.code}</h1>
          <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    console.log("\n📧 Mail options prepared:");
    console.log("  From:", mailOptions.from);
    console.log("  To:", mailOptions.to);
    console.log("  Subject:", mailOptions.subject);
    
    console.log("\n📧 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    
    console.log("\n✅ SUCCESS: Email sent!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    console.log("========== ✅ EMAIL SENT SUCCESSFULLY ==========\n");
    
    return info;

  } catch (error) {
    console.error("\n❌ SMTP ERROR:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response:", error.response);
    console.error("Full error details:", error);
    console.error("========== ❌ EMAIL SENDING FAILED ==========\n");
    throw error;
  }
};

module.exports = sendEmail;
