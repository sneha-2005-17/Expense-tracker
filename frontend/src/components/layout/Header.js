import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { IconBell } from '../ui/Icons';

const Header = ({ title, onMenuClick }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [showAlerts, setShowAlerts] = useState(false);
  const unread = notifications.length;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:bg-slate-900/70 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2.5 text-slate-600 transition-all hover:bg-white/80 lg:hidden dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative rounded-xl p-2.5 text-slate-600 transition-all hover:bg-white/80 dark:text-slate-400 dark:hover:bg-white/5"
              aria-label="Notifications"
            >
              <IconBell />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {showAlerts && (
              <div className="absolute right-0 mt-2 w-80 animate-scale-in rounded-2xl border border-white/20 bg-white/95 p-2 shadow-glass-lg backdrop-blur-xl dark:bg-slate-900/95">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">No new alerts</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                      <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-slate-500">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2.5 text-slate-600 transition-all hover:bg-white/80 dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <Link
            to="/profile"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-white shadow-md transition-transform hover:scale-105"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
