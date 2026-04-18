const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  address: { type: String, default: '' },
  // Password reset OTP fields
  resetOTPHash: { type: String, default: '' },
  resetOTPExpires: { type: Date },
  role: { type: String, required: true, enum: ['CUSTOMER', 'MANAGER', 'ADMIN'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
