const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['Inbound', 'Outbound'] },
  item: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Scheduled', 'In Transit', 'Completed', 'Cancelled', 'Rejected'], default: 'Pending' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

