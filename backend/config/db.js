const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 3000) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense-tracker';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('\n--- Could not connect to MongoDB ---');
        console.error('1. Make sure MongoDB is installed and running');
        console.error('2. Or update MONGODB_URI in backend/.env (e.g. MongoDB Atlas)');
        console.error(`   Current URI: ${uri}\n`);
        process.exit(1);
      }
      console.log(`Retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

module.exports = connectDB;
