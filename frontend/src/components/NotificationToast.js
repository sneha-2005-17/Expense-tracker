import React from 'react';
import { useNotifications } from '../context/NotificationContext';

const typeStyles = {
  success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-900/30',
  error: 'border-red-500/30 bg-red-50/90 dark:bg-red-900/30',
  warning: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-900/30',
  info: 'border-primary-500/30 bg-primary-50/90 dark:bg-primary-900/30',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const NotificationToast = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-full max-w-sm flex-col gap-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto animate-slide-down rounded-2xl border p-4 shadow-glass-lg backdrop-blur-xl ${typeStyles[n.type]}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold shadow-sm dark:bg-slate-800">
              {typeIcons[n.type]}
            </span>
            <div className="min-w-0 flex-1">
              {n.title && <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>}
              <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeNotification(n.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/50 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
