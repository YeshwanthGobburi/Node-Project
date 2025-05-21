const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  saltUsed: { type: String },
  role: {
    type: String,
    enum: ['admin', 'manager', 'cashier', 'user'],
    default: 'user'
  },
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  lastUsedOtp: {
    code: { type: String },
    usedAt: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date },
});

module.exports = mongoose.model('User', userSchema);

