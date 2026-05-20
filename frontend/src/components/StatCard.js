import React from 'react';

const StatCard = ({ title, value, icon, gradient, subtitle }) => (
  <div
    className={`card animate-slide-up overflow-hidden bg-gradient-to-br ${gradient} text-white border-0`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-white/70">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
