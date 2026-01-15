const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'lumoflow-secret-fallback';

const authController = {
  // 1. SIGNUP
  async signup(event, data) {
    try {
      const { name, email, password } = data;
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
  async login(event, data) {
    try {
      const { email, password } = data;
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return { success: false, msg: 'Invalid credentials' };
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return { success: false, msg: 'Invalid credentials' };
      const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });
      return { 
        success: true, 
        token, 
        user: { 
          _id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          avatar: user.avatar || '',
          bio: user.bio || ''
        } 
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
          avatar: picture,
          role: 'student',
          isVerified: true
        });
        await user.save();
      } else {
        // Update avatar if user exists but logged in via OAuth
        if (picture && user.avatar !== picture) {
          user.avatar = picture;
          await user.save();
        }
      }

      const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });

      return {
        success: true,
        token,
        user: { 
          _id: user._id.toString(),
          name: user.name, 
          email: user.email,
          avatar: user.avatar || '',
          bio: user.bio || ''
        }
      };
    } catch (err) {
      console.error('Google OAuth Error:', err);
      return { success: false, msg: 'Google connection failed' };
    }
  },
  // 4. FORGOT PASSWORD
  async forgotPassword(event, data) {
    try {
      const email = typeof data === 'string' ? data : data.email;
      const cleanEmail = email.toLowerCase().trim();
      console.log('\n📧 FORGOT PASSWORD REQUEST for:', cleanEmail);
      
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        console.log('❌ User not found:', cleanEmail);
        return { success: false, msg: 'Email not found in database.' };
      }

      console.log('✅ User found:', user.email);
      
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      user.resetPasswordCode = resetToken;
      user.resetPasswordExpires = Date.now() + 600000; // 10 mins
      await user.save();
      
      console.log('✅ Reset code generated:', resetToken);
      console.log('✅ Reset code saved to database');

      try {
        console.log('📧 Attempting to send email...');
        await sendEmail({
          email: user.email,
          subject: 'LumoFlow Recovery Code',
          code: resetToken
        });
        console.log('✅ Email sent successfully');
        return { success: true, msg: 'OTP sent to your email!' };
      } catch (emailErr) {
        console.error('\n❌ EMAIL SENDING FAILED');
        console.error('Error message:', emailErr.message);
        console.error('Error code:', emailErr.code);
        console.error('Full error:', emailErr);
        console.log('✅ BUT: Reset code was generated and saved. User can still use it.\n');
        
        // Return success because code was generated, even if email failed
        return { 
          success: true, 
          msg: 'Code generated! Email delivery failed - check spam folder or contact support.' 
        };
      }
    } catch (err) {
      console.error('\n❌ FORGOT PASSWORD ERROR');
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      return { success: false, msg: `Error: ${err.message}` };
    }
  },

  // 5. RESET PASSWORD
  async resetPassword(event, data) {
    try {
      const { email, code, newPassword } = data;
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