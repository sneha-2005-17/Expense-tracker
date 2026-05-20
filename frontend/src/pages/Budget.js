import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

const Budget = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budget', { params: { month, year } });
      setBudgetData(data);
      if (data.limit) setLimit(String(data.limit));
    } catch {
      setBudgetData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!limit || Number(limit) < 1) {
      setError('Please enter a valid budget limit');
      return;
    }
    setSaving(true);
    try {
      await api.post('/budget', { month, year, limit: Number(limit) });
      setSuccess('Budget updated successfully!');
      fetchBudget();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-slate-500">
        Set your monthly spending limit for {monthName} {year}
      </p>

      {/* Budget status card */}
      <div
        className={`card animate-slide-up ${
          budgetData?.exceeded
            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
            : ''
        }`}
      >
        {budgetData?.exceeded && (
          <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            ⚠️ Warning: You have exceeded your monthly budget limit!
          </div>
        )}

        <h3 className="text-lg font-semibold">Current Month Status</h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Budget Limit</p>
            <p className="text-xl font-bold text-primary-600">
              {budgetData?.limit ? formatCurrency(budgetData.limit) : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Spent</p>
            <p className="text-xl font-bold text-rose-600">
              {formatCurrency(budgetData?.spent || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Remaining</p>
            <p className="text-xl font-bold text-emerald-600">
              {budgetData?.limit
                ? formatCurrency(budgetData.remaining)
                : '—'}
            </p>
          </div>
        </div>

        {budgetData?.limit > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Budget usage</span>
              <span className={budgetData.exceeded ? 'text-red-600 font-semibold' : ''}>
                {budgetData.percentUsed}%
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetData.exceeded
                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: `${Math.min(100, budgetData.percentUsed)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Set budget form */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">Set Monthly Budget</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
              {success}
            </div>
          )}
          <div>
            <label className="label">Monthly Spending Limit ($)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
              step="1"
              className="input-field"
              placeholder="e.g. 2000"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <LoadingSpinner size="sm" /> : 'Save Budget'}
          </button>
        </form>
      </div>

      <div className="card bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20">
        <h4 className="font-semibold text-primary-800 dark:text-primary-300">💡 Tips</h4>
        <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>• Set a realistic budget based on your average monthly expenses</li>
          <li>• Review your spending weekly to stay on track</li>
          <li>• Use the Reports page to identify high-spending categories</li>
        </ul>
      </div>
    </div>
  );
};

export default Budget;
