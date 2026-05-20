const mongoose = require('mongoose');

const INCOME_CATEGORIES = ['Salary', 'Pocket Money', 'Freelance', 'Business', 'Other Income'];
const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Education',
  'Health',
  'Other Expense',
];

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    price: { type: Number, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    merchant: {
      type: String,
      trim: true,
      default: '',
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: '',
    },
    items: {
      type: [itemSchema],
      default: [],
    },
    receiptImage: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['manual', 'scan'],
      default: 'manual',
    },
    ocrConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.INCOME_CATEGORIES = INCOME_CATEGORIES;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
