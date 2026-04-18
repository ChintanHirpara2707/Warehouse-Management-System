const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
    items: { type: [invoiceItemSchema], default: [] },

    // payment info (record-keeping; not a real gateway integration)
    paymentMethod: { type: String, enum: ['UPI', 'QR', 'CARD', null], default: null },
    paymentRef: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);


