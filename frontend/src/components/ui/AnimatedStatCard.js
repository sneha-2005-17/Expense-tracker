import React from 'react';

const gradients = {
  balance: 'from-indigo-500 via-primary-600 to-violet-600',
  income: 'from-emerald-500 via-teal-500 to-cyan-600',
  expense: 'from-rose-500 via-pink-500 to-fuchsia-600',
  savings: 'from-amber-500 via-orange-500 to-red-500',
};

const defaultIcons = {
  income: '📈',
  expense: '📉',
  savings: '🏦',
};

const AnimatedStatCard = ({ title, value, subtitle, icon: Icon, variant = 'balance', delay = 0 }) => (
  <div
    className={`stat-card animate-slide-up bg-gradient-to-br ${gradients[variant]}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
  >
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {subtitle && <p className="mt-1.5 text-xs text-white/70">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30">
        {Icon ? (
          <Icon className="h-6 w-6 text-white" />
        ) : (
          <span className="text-xl">{defaultIcons[variant] || '💰'}</span>
        )}
      </div>
    </div>
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
  </div>
);

export default AnimatedStatCard;

