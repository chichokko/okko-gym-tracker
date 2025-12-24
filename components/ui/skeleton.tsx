import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rectangle';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'text',
    width,
    height,
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-slate-700';

    const variantClasses = {
        text: 'rounded h-4',
        circle: 'rounded-full',
        rectangle: 'rounded-lg',
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'circle' ? 40 : '100%'),
        height: height || (variant === 'circle' ? 40 : variant === 'text' ? 16 : 100),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
            style={style}
        />
    );
};

// Preset skeletons for common use cases
export const SkeletonCard: React.FC = () => (
    <div className="p-4 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
            <Skeleton variant="circle" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} />
            </div>
        </div>
        <Skeleton height={60} variant="rectangle" />
    </div>
);

export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
    <tr className="animate-pulse">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="p-4">
                <Skeleton height={16} width={i === 0 ? '70%' : '50%'} />
            </td>
        ))}
    </tr>
);
