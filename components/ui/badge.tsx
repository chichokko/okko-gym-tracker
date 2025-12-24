import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
}) => (
  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${color || ''}`}>
    {children}
  </span>
);