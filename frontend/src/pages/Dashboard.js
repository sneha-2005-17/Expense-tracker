import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AnimatedStatCard from '../components/ui/AnimatedStatCard';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { IconWallet, IconScan } from '../components/ui/Icons';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency, formatDate } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const chartTooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#fff',
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { warning } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, budgetRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/budget'),
      ]);
      setData(dashRes.data);
      setBudget(budgetRes.data);
      if (budgetRes.data?.exceeded) {
        warning(
          `You've spent ${formatCurrency(budgetRes.data.spent)} of ${formatCurrency(budgetRes.data.limit)}`,
          'Budget exceeded'
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [warning]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="glass-card border-red-200/50 text-red-600 dark:text-red-400">{error}</div>
    );
  }

  const pieData = data?.categoryExpenses?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      {/* Hero welcome */}
      <div className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-violet-500/5 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Financial overview</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Your money at a glance
            </h2>
            <p className="mt-2 text-slate-500">Real-time insights powered by AI analytics</p>
          </div>
          <Link to="/scan" className="btn-primary shrink-0">
            <IconScan className="h-5 w-5" />
            Scan Receipt
          </Link>
        </div>
      </div>

      {budget?.exceeded && (
        <div className="animate-slide-up rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 backdrop-blur-sm">
          <p className="font-semibold text-red-600 dark:text-red-400">
            Budget alert — monthly limit exceeded by{' '}
            {formatCurrency(budget.spent - budget.limit)}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard
          title="Total Balance"
          value={formatCurrency(data.balance)}
          variant="balance"
          icon={IconWallet}
          delay={0}
        />
        <AnimatedStatCard
          title="Total Income"
          value={formatCurrency(data.totalIncome)}
          variant="income"
          delay={50}
        />
        <AnimatedStatCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses)}
          variant="expense"
          delay={100}
        />
        <AnimatedStatCard
          title="Net Savings"
          value={formatCurrency(data.savings)}
          subtitle={`This month: ${formatCurrency(data.monthlySavings)}`}
          variant="savings"
          delay={150}
        />
      </div>

      {/* Monthly metrics + budget */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card animate-slide-up stagger-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly income</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(data.monthlyIncome)}</p>
        </div>
        <div className="glass-card animate-slide-up stagger-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly expenses</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(data.monthlyExpenses)}</p>
        </div>
        <div className="glass-card animate-slide-up stagger-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Budget progress</p>
            <span className="text-sm font-bold text-primary-600">
              {budget?.limit ? `${budget.percentUsed}%` : 'Not set'}
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                budget?.exceeded
                  ? 'from-red-500 to-rose-600'
                  : 'from-primary-500 to-violet-500'
              }`}
              style={{ width: `${budget?.limit ? Math.min(100, budget.percentUsed) : 0}%` }}
            />
          </div>
          {budget?.limit > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)} used
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card animate-slide-up">
          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Income vs Expenses</h3>
          <p className="mb-4 text-sm text-slate-500">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.incomeVsExpense}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={chartTooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card animate-slide-up">
          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Spending by category</h3>
          <p className="mb-4 text-sm text-slate-500">This month</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-64 items-center justify-center text-slate-500">No expense data yet</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card animate-slide-up lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold">Monthly spending</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="amount" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="glass-card animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent activity</h3>
            <Link to="/transactions" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
            {data.recentTransactions?.length ? (
              data.recentTransactions.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100/80 p-3 transition-all hover:bg-white/50 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {t.merchant || t.category}
                      {t.source === 'scan' && ' ✨'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/scan" className="btn-primary">
          <IconScan className="h-5 w-5" /> AI Scan
        </Link>
        <Link to="/transactions" className="btn-secondary">+ Add transaction</Link>
        <Link to="/reports" className="btn-secondary">Full analytics</Link>
      </div>
    </div>
  );
};

export default Dashboard;
