const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'lumoflow-secret-fallback';

const authController = {
  async signup(event, { name, email, password }) {
    try {
        // 1. Basic check
        if (!email || !password || !name) {
            return { success: false, msg: 'Please enter all fields' };
        }

        // 2. Check if user already exists in MongoDB
        let user = await User.findOne({ email });
        if (user) {
            return { success: false, msg: 'User with this email already exists' };
        }

        // 3. Hash Password (Secure Storage)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create and Save to MongoDB
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'student', // Default role
            isVerified: false
        });

        await user.save(); // Data is now written to MongoDB!

        return { success: true, msg: 'User registered successfully' };
    } catch (err) {
        console.error('Signup Error:', err);
        return { success: false, msg: 'Database connection failed' };
    }
},
  async login(event, { email, password }) {
    try {
      if (!email || !password) {
        return { success: false, msg: 'Please enter all fields' };
      }

      // Check for user
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, msg: 'Invalid credentials' };
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, msg: 'Invalid credentials' };
      }

      // Create Token
      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      // Return data formatted exactly as Frontend expects
      return {
        success: true,
        msg: 'Login successful',
        token,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: { role_name: user.role },
          status: user.isVerified ? 'verified' : 'pending'
        }
      };
    } catch (err) {
      console.error('Login Controller Error:', err);
      return { success: false, msg: 'Server error during login' };
    }
  },

  async logout() {
    return { success: true, msg: 'Logged out successfully' };
  },

    async googleLogin(event, { email, name, googleId }) {
    try {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: name,
          email: email,
          password: googleId,
          role: 'student',
          isVerified: true
        });
        await user.save();
      }
      const payload = { user: { id: user.id, role: user.role } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      return {
        success: true,
        msg: 'Google Login Successful',
        token,
        user: { _id: user.id, name: user.name, email: user.email, role: { role_name: user.role } }
      };
    } catch (err) {
      console.error('Google Login Error:', err);
      return { success: false, msg: 'Server error during Google auth' };
    }
  }, // <--- MAKE SURE THIS COMMA IS HERE

  async forgotPassword(event, { email }) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, msg: 'Email not found' };
      }

      const crypto = require('crypto'); // Ensure crypto is available
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();

      user.resetPasswordCode = resetToken;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      try {
        await sendEmail({
          email: user.email,
          subject: 'LumoFlow - Password Reset Code',
          code: resetToken,
          message: `Your reset code is: ${resetToken}`
        });
        return { success: true, msg: 'Reset code sent to email' };
      } catch (emailError) {
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return { success: false, msg: 'Email could not be sent' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, msg: 'Server Error' };
    }
  }
};// <--- This closing brace must be AFTER forgotPassword
// This should already be in your authController.js

module.exports = authController;