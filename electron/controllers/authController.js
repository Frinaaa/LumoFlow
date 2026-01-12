const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'lumoflow-secret-fallback';

const authController = {
  async signup(event, { name, email, password, role }) {
    try {
      if (!email || !password || !name) {
        return { success: false, msg: 'Please enter all fields' };
      }

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return { success: false, msg: 'User already exists' };
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'student',
        isVerified: false
      });

      await user.save();

      return { success: true, msg: 'User registered successfully' };
    } catch (err) {
      console.error('Signup Controller Error:', err);
      return { success: false, msg: 'Server error during signup' };
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

      // Create Token (Optional in local app, but good for keeping structure)
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
    // Perform any cleanup if needed
    return { success: true, msg: 'Logged out successfully' };
  }
};

module.exports = authController;