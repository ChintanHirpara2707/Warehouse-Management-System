const express = require('express');
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory.js');
const ServiceRequest = require('../models/ServiceRequest.js');
const Invoice = require('../models/Invoice.js');
const User = require('../models/User.js');

const router = express.Router();

// Middleware to check if user is customer (simplified - in production, use JWT)
const isCustomer = async (req, res, next) => {
  // For now, we'll skip auth check - in production, verify JWT token
  // const token = req.headers.authorization;
  // Verify token and check role === 'CUSTOMER'
  next();
};

// ========== INVENTORY ==========

// Get customer's inventory
router.get('/inventory', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      console.error('Customer ID is missing from query');
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Convert customerId string to ObjectId
    let customerObjectId;
    try {
      customerObjectId = new mongoose.Types.ObjectId(customerId);
    } catch (err) {
      console.error('Invalid customerId format:', customerId, err);
      return res.status(400).json({ message: 'Invalid customer ID format', error: err.message });
    }



    // Get all active inventory items for the customer
    const inventory = await Inventory.find({ customerId: customerObjectId, status: 'Active' })
      .sort({ inboundDate: -1 })
      .lean(); // Use lean() for better performance

    // Format dates for frontend
    const formattedInventory = inventory.map(item => ({
      ...item,
      _id: item._id.toString(),
      customerId: item.customerId.toString(),
      inboundDate: item.inboundDate ? new Date(item.inboundDate).toISOString() : null,
      outboundDate: item.outboundDate ? new Date(item.outboundDate).toISOString() : null,
      requestType: item.requestType || 'Inbound' // Default to Inbound if not set
    }));

    res.json({ inventory: formattedInventory });
  } catch (err) {
    console.error('Error fetching customer inventory:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ========== SERVICE REQUESTS ==========

// Get customer's service requests
router.get('/service-requests', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const customerObjectId = new mongoose.Types.ObjectId(customerId);
    const requests = await ServiceRequest.find({ customerId: customerObjectId })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error('Error fetching service requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create service request
router.post('/service-requests', isCustomer, async (req, res) => {
  try {
    const { customerId, type, item, qty, startDate, endDate, notes } = req.body;

    if (!customerId || !type || !item || qty === undefined || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const customerObjectId = new mongoose.Types.ObjectId(customerId);
    const newRequest = new ServiceRequest({
      customerId: customerObjectId,
      type,
      item,
      qty: parseInt(qty),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: notes || '',
      status: 'Pending'
    });

    await newRequest.save();
    res.status(201).json({ message: 'Service request created successfully', request: newRequest });
  } catch (err) {
    console.error('Error creating service request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service request
router.put('/service-requests/:id', isCustomer, async (req, res) => {
  try {
    const { item, qty, startDate, endDate, notes } = req.body;

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        ...(item && { item }),
        ...(qty !== undefined && { qty: parseInt(qty) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes })
      },
      { new: true, runValidators: true }
    );

    if (!request) return res.status(404).json({ message: 'Service request not found' });

    res.json({ message: 'Service request updated successfully', request });
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service request
router.delete('/service-requests/:id', isCustomer, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Service request not found' });

    res.json({ message: 'Service request deleted successfully' });
  } catch (err) {
    console.error('Error deleting service request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== INVOICES ==========

// Get customer's invoices
router.get('/invoices', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    let customerObjectId;
    try {
      customerObjectId = new mongoose.Types.ObjectId(customerId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    // 1) Find all inbound service requests that are completed for this customer
    const inboundCompletedRequests = await ServiceRequest.find({
      customerId: customerObjectId,
      type: 'Inbound',
      status: 'Completed'
    }).sort({ createdAt: -1 });

    const pricePerItem = 25; // ₹25 per item

    // 2) For each service request, ensure there is an invoice
    for (const req of inboundCompletedRequests) {
      let invoice = await Invoice.findOne({
        customerId: customerObjectId,
        serviceRequestId: req._id
      });

      if (!invoice) {
        const qty = req.qty || 0;
        const amount = qty * pricePerItem;

        const invoiceNumber = `INV-${new Date(req.createdAt || Date.now()).getFullYear()}-${req._id
          .toString()
          .slice(-6)
          .toUpperCase()}`;

        invoice = new Invoice({
          customerId: customerObjectId,
          serviceRequestId: req._id,
          invoiceNumber,
          amount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          items: [
            {
              description: `Inbound Storage / Handling for ${req.item}`,
              quantity: qty,
              rate: pricePerItem,
              total: amount
            }
          ]
        });

        await invoice.save();
      }
    }

    // 3) Fetch all invoices for this customer (only those linked to a serviceRequest)
    const invoices = await Invoice.find({
      customerId: customerObjectId,
      serviceRequestId: { $ne: null }
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      invoices: invoices.map((inv) => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate,
        amount: inv.amount,
        status: inv.status,
        items: inv.items || [],
        paymentMethod: inv.paymentMethod || null,
        paymentRef: inv.paymentRef || ''
      }))
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get full details for a single invoice (for on-screen invoice page)
router.get('/invoices/:id', isCustomer, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email address')
      .populate('serviceRequestId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Try to find related inventory to get location (if any)
    let location = 'N/A';
    if (invoice.serviceRequestId) {
      const inv = await Inventory.findOne({ requestId: invoice.serviceRequestId._id }).lean();
      if (inv && inv.location) {
        location = inv.location;
      }
    }

    const customer = invoice.customerId;
    const service = invoice.serviceRequestId;

    res.json({
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt,
      dueDate: invoice.dueDate,
      amount: invoice.amount,
      status: invoice.status,
      paidDate: invoice.paidDate,
      paymentMethod: invoice.paymentMethod || null,
      paymentRef: invoice.paymentRef || '',
      customer: customer
        ? {
          name: customer.name,
          email: customer.email,
          address: customer.address || ''
        }
        : null,
      service: service
        ? {
          type: service.type,
          startDate: service.startDate,
          endDate: service.endDate,
          item: service.item,
          qty: service.qty
        }
        : null,
      location,
      items: invoice.items || []
    });
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay invoice (record-keeping; not a real gateway integration)
router.post('/invoices/:id/pay', isCustomer, async (req, res) => {
  try {
    const { paymentMethod, paymentRef } = req.body || {};

    if (!paymentMethod || !['QR', 'UPI', 'CARD'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }

    invoice.status = 'Paid';
    invoice.paidDate = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.paymentRef = paymentRef || '';
    await invoice.save();

    res.json({
      message: 'Payment recorded successfully',
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        paidDate: invoice.paidDate,
        paymentMethod: invoice.paymentMethod,
        paymentRef: invoice.paymentRef
      }
    });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== REPORTS ==========

// Generate inventory report
router.get('/reports/inventory', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const inventory = await Inventory.find({ customerId });

    // In production, generate PDF/Excel report
    res.json({
      message: 'Report generated successfully',
      data: inventory,
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('Error generating inventory report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate activity report
router.get('/reports/activity', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const requests = await ServiceRequest.find({ customerId });

    res.json({
      message: 'Report generated successfully',
      data: requests,
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('Error generating activity report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate billing report
router.get('/reports/billing', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // In production, calculate actual billing from service usage
    res.json({
      message: 'Report generated successfully',
      data: { totalBilling: 0, period: 'N/A' },
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('Error generating billing report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== DASHBOARD STATISTICS ==========

// Get customer dashboard statistics
router.get('/stats', isCustomer, async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Convert customerId string to ObjectId
    let customerObjectId;
    try {
      customerObjectId = new mongoose.Types.ObjectId(customerId);
    } catch (err) {
      console.error('Invalid customerId format:', customerId);
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    // Get total inventory items
    const totalInventory = await Inventory.countDocuments({ customerId: customerObjectId, status: 'Active' });

    // Calculate total quantity of items
    const inventoryItems = await Inventory.find({ customerId: customerObjectId, status: 'Active' });
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.qty || 0), 0);

    // Calculate storage used (assuming 1 item = 1 unit, can be customized)
    // For now, using a simple calculation: totalQuantity / maxCapacity * 100
    const maxCapacity = 1000; // This can be configured per customer
    const storageUsed = Math.min(Math.round((totalQuantity / maxCapacity) * 100), 100);

    // Get inbound requests for this week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const inboundThisWeek = await ServiceRequest.countDocuments({
      customerId: customerObjectId,
      type: 'Inbound',
      createdAt: { $gte: startOfWeek }
    });

    // Get rejected requests
    const rejectedRequests = await ServiceRequest.countDocuments({
      customerId: customerObjectId,
      status: 'Rejected'
    });

    // Get scheduled outbound requests
    const scheduledOutbound = await ServiceRequest.countDocuments({
      customerId: customerObjectId,
      type: 'Outbound',
      status: { $in: ['Scheduled', 'In Transit'] }
    });

    // Get pending requests
    const pendingRequests = await ServiceRequest.countDocuments({
      customerId: customerObjectId,
      status: 'Pending'
    });

    // Get active inventory locations count
    const uniqueLocations = await Inventory.distinct('location', { customerId: customerObjectId, status: 'Active' });
    const locationCount = uniqueLocations.length;

    const stats = {
      totalInventory: totalInventory,
      totalQuantity: totalQuantity,
      storageUsed: storageUsed,
      inboundThisWeek: inboundThisWeek,
      rejectedRequests: rejectedRequests,
      scheduledOutbound: scheduledOutbound,
      pendingRequests: pendingRequests,
      locationCount: locationCount
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching customer statistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

