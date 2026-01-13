const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'lumoflow-secret-fallback';

const authController = {
  // 1. SIGNUP
  async signup(event, { name, email, password }) {
    try {
      if (!email || !password || !name) return { success: false, msg: 'All fields required' };
      let user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) return { success: false, msg: 'User already exists' };

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({ name, email: email.toLowerCase().trim(), password: hashedPassword, role: 'student' });
      await user.save();
      return { success: true, msg: 'User registered successfully' };
    } catch (err) {
      return { success: false, msg: 'Signup error' };
    }
  },

  // 2. LOGIN
  async login(event, { email, password }) {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return { success: false, msg: 'Invalid credentials' };
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return { success: false, msg: 'Invalid credentials' };
      const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });
      return { 
        success: true, 
        token, 
        user: { _id: user.id, name: user.name, email: user.email, role: { role_name: user.role } } 
      };
    } catch (err) {
      return { success: false, msg: 'Login error' };
    }
  },

  // 3. GOOGLE LOGIN
 // Inside the authController object in authController.js:

  async googleLogin(event, { email, name, googleId }) {
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // 1. Check if user already exists in MongoDB
      let user = await User.findOne({ email: cleanEmail });
      let isNewUser = false;

      if (!user) {
        // 2. If NO account exists, create one automatically (Social Signup)
        user = new User({
          name: name,
          email: cleanEmail,
          password: googleId, // Placeholder password
          role: 'student',
          isVerified: true
        });
        await user.save();
        isNewUser = true; // Mark that we just created this person
      }

      // 3. Create a session token
      const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });

      return {
        success: true,
        token,
        isNewUser, // <--- Frontend uses this to decide where to go
        user: { name: user.name, email: user.email }
      };
    } catch (err) {
      return { success: false, msg: 'Google connection failed' };
    }
  },
  // 4. FORGOT PASSWORD (OTP SEND)
  async forgotPassword(event, { email }) {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return { success: false, msg: 'Email not found in database.' };

      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      user.resetPasswordCode = resetToken;
      user.resetPasswordExpires = Date.now() + 600000; // 10 mins
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'LumoFlow Recovery Code',
        code: resetToken
      });

      return { success: true, msg: 'OTP sent to your email!' };
    } catch (err) {
      console.error("Forgot Pass Error:", err.message);
      return { success: false, msg: 'Error sending email.' };
    }
  },

  // 5. RESET PASSWORD (OTP VERIFY)
  async resetPassword(event, { email, code, newPassword }) {
    try {
      const user = await User.findOne({ 
        email: email.toLowerCase().trim(),
        resetPasswordCode: code,
        resetPasswordExpires: { $gt: Date.now() } 
      });

      if (!user) return { success: false, msg: 'Invalid or expired code.' };

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return { success: true, msg: 'Password updated successfully!' };
    } catch (err) {
      return { success: false, msg: 'Reset failed.' };
    }
  },

  // 6. LOGOUT
  async logout() {
    return { success: true };
  }
};

module.exports = authController;