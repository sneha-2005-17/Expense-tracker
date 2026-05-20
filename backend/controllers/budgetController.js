const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get budget for month/year
// @route   GET /api/budget
const getBudget = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const spentResult = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = spentResult[0]?.total || 0;
    const limit = budget?.limit || 0;
    const exceeded = limit > 0 && spent > limit;

    res.json({
      budget: budget || null,
      month,
      year,
      limit,
      spent,
      remaining: limit > 0 ? Math.max(0, limit - spent) : 0,
      exceeded,
      percentUsed: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Set or update monthly budget
// @route   POST /api/budget
const setBudget = async (req, res) => {
  try {
    const { month, year, limit } = req.body;

    if (!limit || limit < 1) {
      return res.status(400).json({ message: 'Please provide a valid budget limit' });
    }

    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month: m, year: y },
      { limit: Number(limit) },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { getBudget, setBudget };
