import React from 'react';

interface FloatingActionButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    className?: string;
    hideOnDesktop?: boolean;
    variant?: 'primary' | 'subtle';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onClick,
    icon,
    label,
    className = '',
    hideOnDesktop = true,
    variant = 'primary',
}) => {
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500",
        subtle: "bg-gray-50 text-slate-700 border border-gray-200 hover:bg-gray-100 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-900",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-slate-900/10 dark:shadow-black/30 transition-all active:scale-95 hover:scale-105 ${variants[variant]} ${hideOnDesktop ? 'md:hidden' : ''} ${className}`}
        >
            {icon}
        </button>
    );
};
