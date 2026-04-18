const express = require('express');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');

const router = express.Router();

const crypto = require('crypto');
let emailjs;
try {
  emailjs = require('@emailjs/nodejs');
} catch (e) {
  emailjs = null;
}

function hashOtp(otp) {
  const pepper = process.env.OTP_PEPPER || '';
  return crypto.createHash('sha256').update(`${otp}${pepper}`).digest('hex');
}

function hasEmailJsConfig() {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
      process.env.EMAILJS_TEMPLATE_ID &&
      process.env.EMAILJS_PUBLIC_KEY &&
      process.env.EMAILJS_PRIVATE_KEY &&
      emailjs
  );
}

async function sendOtpEmail({ toEmail, otp, expiresMinutes }) {
  if (!hasEmailJsConfig()) {
    const err = new Error('EmailJS is not configured');
    err.code = 'NO_EMAIL_PROVIDER';
    throw err;
  }

  const params = {
    to_email: toEmail,
    otp,
    expires_minutes: String(expiresMinutes)
  };

  await emailjs.send(
    process.env.EMAILJS_SERVICE_ID,
    process.env.EMAILJS_TEMPLATE_ID,
    params,
    {
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY
    }
  );

  return { provider: 'emailjs' };
}

// DEV: verify EmailJS configuration quickly
router.get('/emailjs/verify', (req, res) => {
  res.json({
    ok: hasEmailJsConfig(),
    message: hasEmailJsConfig()
      ? 'EmailJS is configured.'
      : 'EmailJS is not configured (missing EMAILJS_* env vars or package).'
  });
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Replace with JWT later
    const token = 'dummy-jwt-token'; 
    res.json({ token, role: user.role, name: user.name, email: user.email, userId: user._id, _id: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE PROFILE
router.put('/profile/update', async (req, res) => {
  try {
    const { email, name, phone, company, address } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { name, phone, company, address },
      { new: true }
    );

    if (!user) return res.status(400).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CHANGE PASSWORD
router.put('/profile/change-password', async (req, res) => {
  try {
    console.log('Received /profile/change-password request with body:', req.body);
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// FORGOT PASSWORD - generate OTP and send to email (or log)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetOTPHash = hashOtp(otp);
    user.resetOTPExpires = expires;
    await user.save();

    await sendOtpEmail({ toEmail: email, otp, expiresMinutes: 15 });

    res.json({ message: 'OTP sent if email exists' });
  } catch (err) {
    if (err && err.code === 'NO_EMAIL_PROVIDER') {
      return res.status(500).json({
        message:
          'Email sending is not configured. Configure EmailJS (EMAILJS_*) in .env and restart the backend.'
      });
    }
    if (err && (err.status || err.text)) {
      return res.status(500).json({
        message: 'EmailJS failed to send OTP email. Check EMAILJS_* keys and template variables.',
        emailjs: {
          status: err.status,
          text: err.text
        }
      });
    }
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// RESET PASSWORD using OTP
router.put('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Missing required fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid OTP or email' });
    if (!user.resetOTPHash) return res.status(400).json({ message: 'Invalid OTP or email' });
    if (!user.resetOTPExpires || user.resetOTPExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (user.resetOTPHash !== hashOtp(String(otp))) {
      return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOTPHash = '';
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
