const Transaction = require('../models/Transaction');

// @desc    Dashboard summary and analytics
// @route   GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    const matchBase = { user: userId };

    // Overall totals
    const totals = await Transaction.aggregate([
      { $match: matchBase },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    totals.forEach((t) => {
      if (t._id === 'income') totalIncome = t.total;
      if (t._id === 'expense') totalExpenses = t.total;
    });

    const balance = totalIncome - totalExpenses;
    const savings = balance;

    // Monthly filter for period stats
    const monthStart = month
      ? new Date(year, month - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = month
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyTotals = await Transaction.aggregate([
      {
        $match: {
          ...matchBase,
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    monthlyTotals.forEach((t) => {
      if (t._id === 'income') monthlyIncome = t.total;
      if (t._id === 'expense') monthlyExpenses = t.total;
    });

    // Daily spending for current month
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category-wise expenses (current month or all if no month)
    const categoryExpenses = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Monthly spending for the year (for charts)
    const monthlySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          expenses: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyIncomeChart = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'income',
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          income: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeVsExpense = monthNames.map((name, i) => {
      const exp = monthlySpending.find((m) => m._id === i + 1);
      const inc = monthlyIncomeChart.find((m) => m._id === i + 1);
      return {
        month: name,
        income: inc?.income || 0,
        expenses: exp?.expenses || 0,
      };
    });

    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(8)
      .select('type category amount date merchant notes source');

    res.json({
      totalIncome,
      totalExpenses,
      balance,
      savings,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      dailySpending: dailySpending.map((d) => ({ day: d._id, amount: d.total })),
      categoryExpenses: categoryExpenses.map((c) => ({
        category: c._id,
        amount: c.total,
      })),
      incomeVsExpense,
      monthlySpending: monthlySpending.map((m) => ({
        month: monthNames[m._id - 1],
        amount: m.expenses,
      })),
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { getDashboard };
