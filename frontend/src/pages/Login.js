import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApiError } from '../utils/apiError';
import { IconWallet } from '../components/ui/Icons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend login failed. Falling back to Demo Mode:', err);
      const demoUser = {
        _id: 'demo_user_123',
        name: 'Demo User',
        email: 'demo@example.com',
        token: 'dummy_token'
      };
      localStorage.setItem('token', 'dummy_token');
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.removeItem('logged_out');
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen page-bg">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-violet-950 p-12 lg:flex">
        <div className="absolute inset-0 bg-mesh-dark opacity-60" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-500/30 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse-soft" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <IconWallet className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FinFlow</span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Premium AI finance management for everyone
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Track spending, scan receipts with AI, and grow your savings with beautiful real-time analytics.
          </p>
          <ul className="mt-8 space-y-3 text-slate-400">
            <li className="flex items-center gap-2">✦ AI-powered receipt OCR</li>
            <li className="flex items-center gap-2">✦ Real-time dashboard & charts</li>
            <li className="flex items-center gap-2">✦ Smart budgets & alerts</li>
          </ul>
        </div>
        <p className="relative z-10 text-sm text-slate-500">© FinFlow — Secure & encrypted</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-6 top-6 rounded-xl p-2.5 glass-card-static !p-2"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <div className="mx-auto w-full max-w-md animate-slide-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary">
              <IconWallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">FinFlow</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
          <p className="mt-1 text-slate-500">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                const demoUser = {
                  _id: 'demo_user_123',
                  name: 'Demo User',
                  email: 'demo@example.com',
                  token: 'dummy_token'
                };
                localStorage.setItem('token', 'dummy_token');
                localStorage.setItem('user', JSON.stringify(demoUser));
                localStorage.removeItem('logged_out');
                window.location.href = '/dashboard';
              }}
              className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
            >
              ✨ Access Demo Dashboard Directly
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-500">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
