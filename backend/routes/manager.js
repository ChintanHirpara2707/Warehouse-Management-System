const express = require('express');
const Inventory = require('../models/Inventory.js');
const ServiceRequest = require('../models/ServiceRequest.js');
const User = require('../models/User.js');

const router = express.Router();

// Middleware to check if user is manager (simplified - in production, use JWT)
const isManager = async (req, res, next) => {
  // For now, we'll skip auth check - in production, verify JWT token
  // const token = req.headers.authorization;
  // Verify token and check role === 'MANAGER'
  next();
};

// ========== INVENTORY MANAGEMENT ==========

// Get all inventory items
router.get('/inventory', isManager, async (req, res) => {
  try {
    const inventory = await Inventory.find({})
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ inventory });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory by ID
router.get('/inventory/:id', isManager, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate('customerId', 'name email');
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json({ item });
  } catch (err) {
    console.error('Error fetching inventory item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create inventory item
router.post('/inventory', isManager, async (req, res) => {
  try {
    const { customerId, item, sku, qty, location, status } = req.body;

    if (!customerId || !item || !sku || qty === undefined || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newItem = new Inventory({
      customerId,
      item,
      sku,
      qty: parseInt(qty),
      location,
      status: status || 'Active'
    });

    await newItem.save();
    const populatedItem = await Inventory.findById(newItem._id).populate('customerId', 'name email');
    res.status(201).json({ message: 'Inventory item created successfully', item: populatedItem });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update inventory item
router.put('/inventory/:id', isManager, async (req, res) => {
  try {
    const { item, sku, qty, location, status } = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...(item && { item }),
        ...(sku && { sku }),
        ...(qty !== undefined && { qty: parseInt(qty) }),
        ...(location && { location }),
        ...(status && { status })
      },
      { new: true, runValidators: true }
    ).populate('customerId', 'name email');

    if (!updatedItem) return res.status(404).json({ message: 'Inventory item not found' });

    res.json({ message: 'Inventory item updated successfully', item: updatedItem });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete inventory item
router.delete('/inventory/:id', isManager, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== SERVICE REQUESTS MANAGEMENT ==========

// Get all service requests
router.get('/service-requests', isManager, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error('Error fetching service requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get service request by ID
router.get('/service-requests/:id', isManager, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id).populate('customerId', 'name email');
    if (!request) return res.status(404).json({ message: 'Service request not found' });
    res.json({ request });
  } catch (err) {
    console.error('Error fetching service request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service request status
router.put('/service-requests/:id/status', isManager, async (req, res) => {
  try {
    const { status, location, notes } = req.body; // location is required for inbound requests

    if (!status || !['Pending', 'Scheduled', 'In Transit', 'Completed', 'Cancelled', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get request without populate first to get the actual ObjectId
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Service request not found' });

    // Get the actual customerId ObjectId (before population)
    // IMPORTANT: Get customerId before any populate operations
    const customerId = request.customerId;
    console.log('=== Request Status Update ===');
    console.log('Request ID:', request._id);
    console.log('Request type:', request.type);
    console.log('Request status (old):', request.status);
    console.log('New status:', status);
    console.log('Customer ID (ObjectId):', customerId);
    console.log('Customer ID type:', customerId?.constructor?.name);
    console.log('Customer ID toString:', customerId?.toString());
    
    // Populate for response (after we've saved customerId)
    await request.populate('customerId', 'name email');

    // Update request status
    const oldStatus = request.status;
    request.status = status;
    if (notes) request.notes = notes;
    await request.save();

    // If accepting an inbound request (status changed to Scheduled or Completed), create inventory item
    // Create inventory when: Inbound request becomes Scheduled or Completed (regardless of old status)
    // This handles cases where manager accepts directly or updates status
    console.log('=== Checking if inventory should be created ===');
    console.log('Request type:', request.type);
    console.log('New status:', status);
    console.log('Old status:', oldStatus);
    console.log('Condition check:', {
      isInbound: request.type === 'Inbound',
      isScheduledOrCompleted: status === 'Scheduled' || status === 'Completed',
      allConditionsMet: request.type === 'Inbound' && (status === 'Scheduled' || status === 'Completed')
    });

    if (request.type === 'Inbound' && (status === 'Scheduled' || status === 'Completed')) {
      console.log('✅ Conditions met - will check/create inventory');
      
      // Check if inventory item already exists for this request
      const existingInventory = await Inventory.findOne({ 
        customerId: customerId,
        requestId: request._id
      });

      console.log('Existing inventory check:', existingInventory ? 'Found existing inventory' : 'No existing inventory found');

      if (!existingInventory) {
        console.log('Proceeding to create new inventory item...');
        // Require location for inbound requests
        if (!location) {
          return res.status(400).json({ message: 'Location is required for accepting inbound requests' });
        }

        // Generate SKU from request ID
        const sku = `REQ-${request._id.toString().slice(-6)}`;
        
        // Create inventory item
        console.log('=== Creating Inventory Item ===');
        console.log('Request ID:', request._id);
        console.log('Request customerId (ObjectId):', customerId);
        console.log('Request customerId type:', customerId?.constructor?.name);
        console.log('Request customerId toString:', customerId?.toString());
        console.log('Item:', request.item);
        console.log('Quantity:', request.qty);
        console.log('Location:', location);
        
        const inventoryItem = new Inventory({
          customerId: customerId, // Use the actual ObjectId, not populated object
          item: request.item,
          sku: sku,
          qty: request.qty,
          location: location,
          status: 'Active',
          requestType: 'Inbound',
          requestId: request._id,
          inboundDate: request.startDate || new Date()
        });

        console.log('Inventory item object before save:', {
          customerId: inventoryItem.customerId?.toString(),
          item: inventoryItem.item,
          sku: inventoryItem.sku,
          qty: inventoryItem.qty,
          location: inventoryItem.location,
          status: inventoryItem.status,
          requestType: inventoryItem.requestType,
          requestId: inventoryItem.requestId?.toString(),
          inboundDate: inventoryItem.inboundDate
        });

        try {
          await inventoryItem.save();
          console.log(`✅ Inventory item saved successfully to database`);
          console.log('Saved inventory item ID:', inventoryItem._id.toString());
          console.log('Saved inventory item customerId:', inventoryItem.customerId?.toString());
          console.log('Saved inventory item customerId type:', inventoryItem.customerId?.constructor?.name);
          
          // Verify the inventory was saved correctly
          const verifyInventory = await Inventory.findById(inventoryItem._id);
          if (verifyInventory) {
            console.log('✅ Verification: Inventory found in database');
            console.log('Verified inventory customerId:', verifyInventory.customerId?.toString());
            console.log('Verified inventory item:', verifyInventory.item);
            console.log('Verified inventory qty:', verifyInventory.qty);
            console.log('Verified inventory location:', verifyInventory.location);
          } else {
            console.error('❌ Verification FAILED: Inventory NOT found in database after save!');
          }
        } catch (saveError) {
          console.error('❌ ERROR saving inventory item to database:');
          console.error('Error name:', saveError.name);
          console.error('Error message:', saveError.message);
          console.error('Error stack:', saveError.stack);
          if (saveError.errors) {
            console.error('Validation errors:', saveError.errors);
          }
          // Don't throw - let the request status update succeed even if inventory save fails
          // But log it clearly so we can debug
        }
      } else {
        console.log('⚠️ Inventory item already exists for this request - skipping creation');
      }
    } else {
      console.log('⚠️ Conditions NOT met - inventory will NOT be created');
      console.log('Reason: Request type must be Inbound AND status must be Scheduled or Completed');
    }

    // If cancelling/rejecting, don't create inventory
    if (status === 'Cancelled' || status === 'Rejected') {
      // Optionally, you can delete inventory if it was already created
      if (oldStatus === 'Scheduled' || oldStatus === 'Completed') {
        await Inventory.deleteOne({ requestId: request._id });
        console.log(`Inventory item removed for cancelled/rejected request ${request._id}`);
      }
    }

    // If completing an outbound request, reduce inventory quantity
    if (request.type === 'Outbound' && status === 'Completed') {
      // Find matching inventory items using the actual customerId ObjectId
      const inventoryItems = await Inventory.find({
        customerId: customerId, // Use the actual ObjectId, not populated object
        item: request.item,
        status: 'Active'
      }).sort({ inboundDate: 1 }); // FIFO - First In First Out

      let remainingQty = request.qty;
      for (const invItem of inventoryItems) {
        if (remainingQty <= 0) break;

        if (invItem.qty <= remainingQty) {
          // Remove entire item
          remainingQty -= invItem.qty;
          invItem.qty = 0;
          invItem.status = 'Deactivate';
          invItem.outboundDate = new Date();
        } else {
          // Reduce quantity
          invItem.qty -= remainingQty;
          remainingQty = 0;
        }
        await invItem.save();
      }
    }

    // Populate customerId for response
    await request.populate('customerId', 'name email');
    res.json({ message: 'Service request status updated successfully', request });
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== STATISTICS ==========

// Get dashboard statistics
router.get('/stats', isManager, async (req, res) => {
  try {
    const totalInventory = await Inventory.countDocuments();
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'Pending' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const inboundToday = await ServiceRequest.countDocuments({
      type: 'Inbound',
      startDate: { $gte: today, $lt: tomorrow }
    });

    const outboundToday = await ServiceRequest.countDocuments({
      type: 'Outbound',
      startDate: { $gte: today, $lt: tomorrow }
    });

    res.json({
      totalInventory,
      pendingRequests,
      inboundToday,
      outboundToday
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

