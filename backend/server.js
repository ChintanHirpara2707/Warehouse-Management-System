const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./routes/auth.js');
const adminRoutes = require('./routes/admin.js');
const managerRoutes = require('./routes/manager.js');
const customerRoutes = require('./routes/customer.js');

dotenv.config();

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("----------------------------------------------------");
    console.log(" ✅ 🌐 🗄 MongoDB connected successfully 🎉");
    console.log("----------------------------------------------------\n");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    console.error("Please check your MONGO_URI in .env file");
  });

// Log MongoDB connection status
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});
/* Routes */
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/manager', managerRoutes);
app.use('/customer', customerRoutes);

/* Test Route */
app.get("/", (req, res) => {
  res.json({ message: "ANWS Backend Server Running" });
});

// Fallback 404 handler - always return JSON (no HTML)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* Server Start */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
