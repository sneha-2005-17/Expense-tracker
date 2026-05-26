const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 3000) => {
  mongoose.set('bufferCommands', false);
  const uri = process.env.MONGODB_URI;
  const isVercel = !!process.env.VERCEL;

  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables.');
    if (isVercel) {
      console.error('MongoDB connection aborted: missing URI on Vercel.');
      return;
    }
  }

  const finalUri = uri || 'mongodb://127.0.0.1:27017/expense-tracker';
  const maxRetries = isVercel ? 1 : retries;
  const timeoutMs = isVercel ? 3000 : 8000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(finalUri, {
        serverSelectionTimeoutMS: timeoutMs,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt === maxRetries) {
        console.error('\n--- Could not connect to MongoDB ---');
        console.error(`   Current URI: ${finalUri}\n`);
        if (!isVercel) {
          process.exit(1);
        }
      } else {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
};

module.exports = connectDB;
