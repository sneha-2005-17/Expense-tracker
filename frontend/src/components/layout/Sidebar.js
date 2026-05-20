import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navIcons, IconLogout, IconWallet } from '../ui/Icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/scan', label: 'AI Scanner' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports', label: 'Analytics' },
  { to: '/budget', label: 'Budget' },
  { to: '/profile', label: 'Profile' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-white/10 bg-white/80 shadow-glass-lg backdrop-blur-2xl transition-transform duration-300 dark:bg-slate-900/90 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/50 px-6 py-6 dark:border-white/5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <IconWallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              FinFlow
            </h1>
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
              AI Finance Pro
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = navIcons[item.to] || navIcons['/dashboard'];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/50 p-4 dark:border-white/5">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="mb-3 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/50 dark:hover:bg-white/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="nav-item w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
