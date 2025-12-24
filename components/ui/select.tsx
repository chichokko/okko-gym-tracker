import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, children, className, ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && (
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      className={`h-12 px-4 rounded-lg bg-gray-50 border border-gray-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white ${className || ''}`}
      {...props}
    >
      {children}
    </select>
  </div>
);