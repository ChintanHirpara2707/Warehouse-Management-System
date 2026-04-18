const express = require('express');
const User = require('../models/User.js');
const BillingRule = require('../models/BillingRule.js');

const router = express.Router();

// Middleware to check if user is admin (simplified - in production, use JWT)
const isAdmin = async (req, res, next) => {
  // For now, we'll skip auth check - in production, verify JWT token
  // const token = req.headers.authorization;
  // Verify token and check role === 'ADMIN'
  next();
};

// ========== USER MANAGEMENT ==========

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password -resetOTPHash -resetOTPExpires');
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetOTPHash -resetOTPExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', isAdmin, async (req, res) => {
  try {
    const { name, role, phone, company, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, phone, company, address },
      { new: true, runValidators: true }
    ).select('-password -resetOTPHash -resetOTPExpires');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== BILLING RULES MANAGEMENT ==========

// Initialize default billing rules if none exist
const initializeDefaultBillingRules = async () => {
  const count = await BillingRule.countDocuments();
  if (count === 0) {
    const defaultRules = [
      {
        name: 'Storage Fee',
        type: 'storage',
        rate: 5.00,
        unit: 'per sqft/month',
        description: 'Monthly storage charge per square foot',
        isActive: true
      },
      {
        name: 'Inbound Handling',
        type: 'handling',
        rate: 25.00,
        unit: 'per item',
        description: 'Fee for receiving and storing inbound items',
        isActive: true
      },
      {
        name: 'Outbound Handling',
        type: 'handling',
        rate: 20.00,
        unit: 'per item',
        description: 'Fee for picking and shipping outbound items',
        isActive: true
      }
    ];
    await BillingRule.insertMany(defaultRules);
    console.log('Default billing rules initialized');
  }
};

// Initialize on module load
initializeDefaultBillingRules();

// Get all billing rules
router.get('/billing-rules', isAdmin, async (req, res) => {
  try {
    const rules = await BillingRule.find({}).sort({ createdAt: -1 });
    res.json({ rules });
  } catch (err) {
    console.error('Error fetching billing rules:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get billing rule by ID
router.get('/billing-rules/:id', isAdmin, async (req, res) => {
  try {
    const rule = await BillingRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Billing rule not found' });
    res.json({ rule });
  } catch (err) {
    console.error('Error fetching billing rule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create billing rule
router.post('/billing-rules', isAdmin, async (req, res) => {
  try {
    const { name, type, rate, unit, description, isActive } = req.body;

    if (!name || !type || rate === undefined || !unit || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRule = new BillingRule({
      name,
      type,
      rate: parseFloat(rate),
      unit,
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    await newRule.save();
    res.status(201).json({ message: 'Billing rule created successfully', rule: newRule });
  } catch (err) {
    console.error('Error creating billing rule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update billing rule
router.put('/billing-rules/:id', isAdmin, async (req, res) => {
  try {
    const { name, type, rate, unit, description, isActive } = req.body;
    
    const rule = await BillingRule.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(type && { type }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(unit && { unit }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    if (!rule) return res.status(404).json({ message: 'Billing rule not found' });

    res.json({ message: 'Billing rule updated successfully', rule });
  } catch (err) {
    console.error('Error updating billing rule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete billing rule
router.delete('/billing-rules/:id', isAdmin, async (req, res) => {
  try {
    const rule = await BillingRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Billing rule not found' });

    res.json({ message: 'Billing rule deleted successfully' });
  } catch (err) {
    console.error('Error deleting billing rule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

