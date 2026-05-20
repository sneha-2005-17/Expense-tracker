import React from 'react';

const sizes = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => (
  <div
    className={`inline-block animate-spin rounded-full border-primary-500 border-t-transparent ${sizes[size]} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export default LoadingSpinner;
