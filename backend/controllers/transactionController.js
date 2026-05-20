const Transaction = require('../models/Transaction');
const { INCOME_CATEGORIES, EXPENSE_CATEGORIES } = require('../models/Transaction');

const getCategories = (req, res) => {
  res.json({
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
  });
};

const getTransactions = async (req, res) => {
  try {
    const { type, category, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
      ];
    }

    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortMap = {
      date: { date: sortOrder },
      amount: { amount: sortOrder },
      category: { category: sortOrder },
    };
    const sort = sortMap[sortBy] || sortMap.date;

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const buildTransactionData = (body, userId) => {
  const {
    type,
    category,
    amount,
    date,
    notes,
    merchant,
    tax,
    paymentMethod,
    items,
    receiptImage,
    source,
    ocrConfidence,
  } = body;

  return {
    user: userId,
    type,
    category,
    amount: Number(amount),
    date: date || new Date(),
    notes: notes || '',
    merchant: merchant || '',
    tax: tax ? Number(tax) : 0,
    paymentMethod: paymentMethod || '',
    items: Array.isArray(items) ? items : [],
    receiptImage: receiptImage || '',
    source: source || 'manual',
    ocrConfidence: ocrConfidence !== undefined ? Number(ocrConfidence) : undefined,
  };
};

const createTransaction = async (req, res) => {
  try {
    const { type, category, amount } = req.body;

    if (!type || !category || !amount) {
      return res.status(400).json({ message: 'Type, category, and amount are required' });
    }

    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category for this transaction type' });
    }

    const transaction = await Transaction.create(buildTransactionData(req.body, req.user._id));
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fields = [
      'type', 'category', 'amount', 'date', 'notes', 'merchant',
      'tax', 'paymentMethod', 'items', 'receiptImage', 'source',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'amount' || field === 'tax') {
          transaction[field] = Number(req.body[field]);
        } else {
          transaction[field] = req.body[field];
        }
      }
    });

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getCategories,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
