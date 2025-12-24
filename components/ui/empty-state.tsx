import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    message: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, message, action }) => (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
        {Icon && <Icon size={48} className="mb-4 opacity-50" />}
        <p className="text-center">{message}</p>
        {action && <div className="mt-4">{action}</div>}
    </div>
);
