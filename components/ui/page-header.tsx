import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && (
                <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
        </div>
        {action && (
            <div className="shrink-0">
                {action}
            </div>
        )}
    </div>
);
