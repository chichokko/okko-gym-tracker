import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'square' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  square: {
    sm: 'w-8 h-8 p-1',
    md: 'w-12 h-12 p-1.5',
    lg: 'w-16 h-16 p-2',
  },
  horizontal: {
    sm: 'w-32 h-auto',
    md: 'w-44 h-auto',
    lg: 'w-60 h-auto',
  },
};

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'square', size = 'sm' }) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const src = isDark
    ? variant === 'horizontal' ? '/dark_okko_logo.svg' : '/dark_okko_square.svg'
    : variant === 'horizontal' ? '/okko_logo.svg' : '/okko_square.svg';
  return (
    <img
      src={src}
      alt="OKKO Logo"
      className={`${sizeClasses[variant][size]} object-contain ${className}`}
    />
  );
};
