import axios from 'axios';

// In dev, use /api (proxied by CRA). In production, set REACT_APP_API_URL in .env
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject custom adapter for Demo Mode bypass
const defaultAdapter = api.defaults.adapter || axios.defaults.adapter;
api.defaults.adapter = async (config) => {
  const isDemo = localStorage.getItem('token') === 'dummy_token';
  if (isDemo) {
    // Strip base URL and leading slashes
    let url = config.url || '';
    if (config.baseURL && url.startsWith(config.baseURL)) {
      url = url.substring(config.baseURL.length);
    }
    url = url.replace(/^\/+/, '');
    const method = (config.method || 'get').toLowerCase();

    // Helper to return mock response
    const mockResponse = (data, status = 200) => ({
      data,
      status,
      statusText: 'OK',
      headers: {},
      config,
      request: {}
    });

    // Helper to get stored items
    const getStored = (key, defaultVal) => {
      const val = localStorage.getItem(key);
      try {
        return val ? JSON.parse(val) : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    };

    // Helper to save stored items
    const saveStored = (key, val) => {
      localStorage.setItem(key, JSON.stringify(val));
    };

    // Initialize mock budget
    const defaultBudget = {
      limit: 2000,
      spent: 1330,
      remaining: 670,
      exceeded: false,
      percentUsed: 66.5,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };
    const budget = getStored('demo_budget', defaultBudget);

    // Initialize mock transactions
    const defaultTransactions = [
      { _id: 't1', type: 'income', category: 'Salary', amount: 5000, date: new Date().toISOString(), merchant: 'Acme Corp', notes: 'Monthly salary' },
      { _id: 't2', type: 'expense', category: 'Rent', amount: 1200, date: new Date(Date.now() - 86400000).toISOString(), merchant: 'Apartment Rental', notes: 'Monthly rent' },
      { _id: 't3', type: 'expense', category: 'Food', amount: 50, date: new Date(Date.now() - 172800000).toISOString(), merchant: 'Grocery Store', notes: 'Weekly groceries' },
      { _id: 't4', type: 'expense', category: 'Entertainment', amount: 80, date: new Date(Date.now() - 259200000).toISOString(), merchant: 'Movie Theater', notes: 'Weekend out' },
      { _id: 't5', type: 'income', category: 'Freelance', amount: 1500, date: new Date(Date.now() - 345600000).toISOString(), merchant: 'Upwork Client', notes: 'Website design project' }
    ];
    let transactions = getStored('demo_transactions', defaultTransactions);

    // Handle GET auth/me
    if (url === 'auth/me') {
      return mockResponse({ _id: 'demo_user_123', name: 'Demo User', email: 'demo@example.com' });
    }

    // Handle GET transactions/categories
    if (url === 'transactions/categories') {
      return mockResponse({
        income: ['Salary', 'Freelance', 'Investment', 'Other'],
        expense: ['Food', 'Rent', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Other']
      });
    }

    // Handle GET budget
    if (url === 'budget') {
      const curMonth = new Date().getMonth() + 1;
      const curYear = new Date().getFullYear();
      const spent = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() + 1 === curMonth && new Date(t.date).getFullYear() === curYear)
        .reduce((sum, t) => sum + t.amount, 0);

      budget.spent = spent;
      budget.remaining = Math.max(0, budget.limit - spent);
      budget.exceeded = spent > budget.limit;
      budget.percentUsed = budget.limit ? Math.round((spent / budget.limit) * 100) : 0;
      saveStored('demo_budget', budget);

      return mockResponse(budget);
    }

    // Handle POST budget
    if (url === 'budget' && method === 'post') {
      const body = JSON.parse(config.data || '{}');
      budget.limit = body.limit || budget.limit;
      saveStored('demo_budget', budget);
      return mockResponse(budget);
    }

    // Handle GET transactions
    if (url === 'transactions') {
      let filtered = [...transactions];
      const params = config.params || {};

      if (params.type) {
        filtered = filtered.filter(t => t.type === params.type);
      }
      if (params.category) {
        filtered = filtered.filter(t => t.category === params.category);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(t => 
          (t.merchant && t.merchant.toLowerCase().includes(s)) || 
          (t.notes && t.notes.toLowerCase().includes(s)) ||
          (t.category && t.category.toLowerCase().includes(s))
        );
      }

      const sortBy = params.sortBy || 'date';
      const sortOrder = params.sortOrder || 'desc';
      filtered.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === 'date') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return mockResponse({ transactions: filtered });
    }

    // Handle POST transactions
    if (url === 'transactions' && method === 'post') {
      const body = JSON.parse(config.data || '{}');
      const newTx = {
        _id: 't_' + Math.random().toString(36).substr(2, 9),
        type: body.type || 'expense',
        category: body.category || 'Other',
        amount: Number(body.amount) || 0,
        date: body.date || new Date().toISOString(),
        merchant: body.merchant || '',
        notes: body.notes || '',
        source: body.source || 'manual'
      };
      transactions.unshift(newTx);
      saveStored('demo_transactions', transactions);
      return mockResponse(newTx);
    }

    // Handle PUT transactions/:id
    if (url.startsWith('transactions/') && method === 'put') {
      const id = url.split('/')[1];
      const body = JSON.parse(config.data || '{}');
      const idx = transactions.findIndex(t => t._id === id);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          category: body.category || transactions[idx].category,
          amount: Number(body.amount) || transactions[idx].amount,
          date: body.date || transactions[idx].date,
          merchant: body.merchant || transactions[idx].merchant,
          notes: body.notes || transactions[idx].notes
        };
        saveStored('demo_transactions', transactions);
        return mockResponse(transactions[idx]);
      }
      return mockResponse({ message: 'Transaction not found' }, 404);
    }

    // Handle DELETE transactions/:id
    if (url.startsWith('transactions/') && method === 'delete') {
      const id = url.split('/')[1];
      transactions = transactions.filter(t => t._id !== id);
      saveStored('demo_transactions', transactions);
      return mockResponse({ success: true });
    }

    // Handle POST receipts/scan
    if (url === 'receipts/scan') {
      return mockResponse({
        success: true,
        partial: false,
        message: 'Bill analyzed successfully. Review the details below.',
        receiptImage: '',
        rawText: 'Mock Receipt Text\nMerchant: Starbucks Coffee\nDate: 2026-05-26\nTotal: 15.45\nTax: 1.25\nItems:\n- Caffè Latte: 5.25\n- Blueberry Muff: 4.50\n- Croissant: 4.45',
        ocrEngine: 'mock-ocr',
        extracted: {
          amount: 15.45,
          merchant: 'Starbucks Coffee',
          date: new Date().toISOString().split('T')[0],
          category: 'Food',
          items: [
            { desc: 'Caffè Latte', price: 5.25 },
            { desc: 'Blueberry Muff', price: 4.50 },
            { desc: 'Croissant', price: 4.45 }
          ],
          analysis: {
            confidence: 95,
            warnings: []
          }
        }
      });
    }

    // Handle GET dashboard
    if (url === 'dashboard') {
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpenses;

      const curMonth = new Date().getMonth() + 1;
      const curYear = new Date().getFullYear();
      const monthlyIncome = transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() + 1 === curMonth && new Date(t.date).getFullYear() === curYear).reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() + 1 === curMonth && new Date(t.date).getFullYear() === curYear).reduce((sum, t) => sum + t.amount, 0);

      const catMap = {};
      transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() + 1 === curMonth).forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      const categoryExpenses = Object.keys(catMap).map(cat => ({ category: cat, amount: catMap[cat] })).sort((a,b) => b.amount - a.amount);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const incomeVsExpense = [];
      const monthlySpending = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mIdx = d.getMonth();
        const yVal = d.getFullYear();
        const mLabel = months[mIdx];

        const inc = transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === mIdx && new Date(t.date).getFullYear() === yVal).reduce((sum, t) => sum + t.amount, 0);
        const exp = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === mIdx && new Date(t.date).getFullYear() === yVal).reduce((sum, t) => sum + t.amount, 0);

        incomeVsExpense.push({ month: mLabel, income: inc || (i > 0 ? 3000 + i * 200 : 0), expenses: exp || (i > 0 ? 1500 + i * 150 : 0) });
        monthlySpending.push({ month: mLabel, amount: exp || (i > 0 ? 1500 + i * 150 : 0) });
      }

      return mockResponse({
        balance,
        totalIncome,
        totalExpenses,
        savings: balance,
        monthlySavings: monthlyIncome - monthlyExpenses,
        monthlyIncome,
        monthlyExpenses,
        incomeVsExpense,
        categoryExpenses,
        monthlySpending,
        recentTransactions: transactions.slice(0, 5)
      });
    }
  }

  return defaultAdapter(config);
};

// Attach JWT from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set multipart boundary for file uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
