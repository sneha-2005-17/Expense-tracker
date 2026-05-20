import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: dash } = await api.get('/dashboard', { params: { year } });
        setData(dash);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500">Failed to load reports</p>;
  }

  const pieData = data.categoryExpenses || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-500">Visual insights into your financial habits</p>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="input-field w-auto"
        >
          {[0, 1, 2].map((offset) => {
            const y = new Date().getFullYear() - offset;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card border-l-4 border-emerald-500">
          <p className="text-sm text-slate-500">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="card border-l-4 border-rose-500">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="card border-l-4 border-amber-500">
          <p className="text-sm text-slate-500">Net Savings</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.savings)}</p>
        </div>
      </div>

      {/* Income vs Expense */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">Income vs Expense Comparison</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.incomeVsExpense}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly spending trend */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Monthly Spending Analysis</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Category-wise Expense Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-slate-500">No data for this period</p>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      {pieData.length > 0 && (
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
          <div className="space-y-3">
            {pieData.map((item, i) => {
              const total = pieData.reduce((s, c) => s + c.amount, 0);
              const pct = total ? Math.round((item.amount / total) * 100) : 0;
              return (
                <div key={item.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span>
                      {formatCurrency(item.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
