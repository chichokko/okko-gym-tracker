import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32
    };

    return (
        <Loader2
            className={`animate-spin text-blue-500 ${className || ''}`}
            size={sizeMap[size]}
        />
    );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        {message && (
            <p className="mt-4 text-sm text-slate-500">{message}</p>
        )}
    </div>
);
