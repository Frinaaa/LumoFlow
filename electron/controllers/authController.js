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

  async googleLoginStep2(payload) {
  try {
    const { email, name, sub: googleId, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();
    
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = new User({
        name: name,
        email: cleanEmail,
        password: googleId, 
        avatar: picture, // 🟢 Save Google Profile Picture
        role: 'student',
        isVerified: true
      });
      await user.save();
    }

    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });

    return {
      success: true,
      token,
      user: { 
        _id: user._id.toString(), // 🟢 Ensure _id is sent as a string
        name: user.name, 
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || ""
      }
    };
  } catch (err) {
    return { success: false, msg: 'Google connection failed' };
  }
},
  // 4. FORGOT PASSWORD
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
      return { success: false, msg: 'Error sending email.' };
    }
  },

  // 5. RESET PASSWORD
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