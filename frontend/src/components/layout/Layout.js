import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from '../NotificationToast';

const titles = {
  '/dashboard': 'Dashboard',
  '/scan': 'AI Receipt Scanner',
  '/transactions': 'Transactions',
  '/reports': 'Analytics',
  '/budget': 'Budget Planner',
  '/profile': 'Profile Settings',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'FinFlow';

  return (
    <div className="page-bg min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotificationToast />
      <div className="lg:pl-[280px]">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-enter p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
