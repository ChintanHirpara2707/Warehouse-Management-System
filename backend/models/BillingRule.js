const mongoose = require('mongoose');

const billingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['storage', 'handling', 'service'] },
  rate: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BillingRule', billingRuleSchema);

