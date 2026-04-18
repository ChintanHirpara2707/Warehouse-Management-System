const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: String, required: true },
  sku: { type: String, required: true },
  qty: { type: Number, required: true, min: 0 },
  location: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Deactivate'], default: 'Active' },
  requestType: { type: String, enum: ['Inbound', 'Outbound'], default: 'Inbound' },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  inboundDate: { type: Date, default: Date.now },
  outboundDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);

