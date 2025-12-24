import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
    label: string;
    icon: LucideIcon;
    isActive: boolean;
    onClick: () => void;
    variant?: 'sidebar' | 'bottom';
}

export const NavItem: React.FC<NavItemProps> = ({
    label,
    icon: Icon,
    isActive,
    onClick,
    variant = 'sidebar'
}) => {
    if (variant === 'bottom') {
        return (
            <button
                onClick={onClick}
                className={`flex flex-col items-center gap-1 ${isActive
                        ? 'text-slate-900 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
            >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${isActive
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );
};
