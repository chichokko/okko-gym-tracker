import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className }) => (
  <label className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${className || ''}`}>
    {children}
  </label>
);