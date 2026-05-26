require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const receiptRoutes = require('./routes/receiptRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Serve uploaded receipt images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API is running' });
});

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/transactions', '/transactions'], transactionRoutes);
app.use(['/api/budget', '/budget'], budgetRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/receipts', '/receipts'], receiptRoutes);

// Fallback to serve static files from uploads folder for stripped path requests
app.use('/', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image must be smaller than 10MB' });
  }
  if (err.message?.includes('Only image files')) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    const { prewarmOCR } = require('./services/ocrService');
    prewarmOCR();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use.`);
      console.error('Close the other app using this port, or change PORT in backend/.env\n');
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });
};

startServer();
