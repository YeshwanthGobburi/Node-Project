require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const auth = require('./middleware/auth');
const role = require('./middleware/role');
const { connectMySQL } = require('./database/mysql');
const { sequelize } = require('./database/mysql');
const Customer = require('./models/customer');
const cookieParser = require('cookie-parser');


// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const UploadImageRoutes = require('./routes/imageRoutes');
const startUserCleanupJob = require('./jobs/cleanup');

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);      // User Authentication Routes
app.use('/api/products', productRoutes);  // Product Management Routes
app.use('/api/sales', saleRoutes); // Checkout,sales and export CSV to mail
app.use('/api/customers', customerRoutes);
app.use('/api/image', UploadImageRoutes);

// Protected Routes Example
// Admin-only route
app.get('/api/test/admin', auth, role('admin'), (req, res) => {
  res.json({ messgae: `Welcome to Admin panel, ${req.user.username}`});
});

// Admin or Manager can access
app.get('/api/test/dashboard', auth, role('admin', 'manager'), (req, res) => {
  res.json({ message: `Welcome to dashboard, ${req.user.username} (${req.user.role})` });
});

// Any logged-in user can access
app.get('/api/test/profile', auth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, role: ${req.user.role}` });
});




// Connect to MongoDB MySQL and start the server
  const startServer = async () => {
    try {
      // Connect MongoDB
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
  
      // Connect and Sync MySQL
      await sequelize.authenticate();
      console.log('MySQL connected');

      await sequelize.sync(); // This ensures tables are created if they don't exist
    console.log('MySQL models synced');
  
      // Start Express server
      app.listen(process.env.PORT, () => {
        console.log(`Server running on http://localhost:${process.env.PORT}`);
      });
  
    } catch (err) {
      console.error('Startup error:', err);
      process.exit(1); // Exit with failure
    }
  };
  
  startUserCleanupJob();
  startServer();
  
