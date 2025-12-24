import React from 'react';
import { DropdownMenu } from './dropdown-menu';
import { Card } from './card';
import { SkeletonCard } from './skeleton';
import { LucideIcon } from 'lucide-react';

interface CardField<T> {
    key: string;
    render: (item: T) => React.ReactNode;
    className?: string;
}

interface ActionItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface MobileCardListProps<T> {
    data: T[];
    keyExtractor: (item: T) => string;
    titleField: (item: T) => React.ReactNode;
    subtitleField?: (item: T) => React.ReactNode;
    metaFields?: CardField<T>[];
    getActions?: (item: T) => ActionItem[];
    isLoading?: boolean;
    loadingCount?: number;
    emptyMessage?: string;
    onCardClick?: (item: T) => void;
}

export function MobileCardList<T>({
    data,
    keyExtractor,
    titleField,
    subtitleField,
    metaFields = [],
    getActions,
    isLoading = false,
    loadingCount = 3,
    emptyMessage = 'No hay datos disponibles.',
    onCardClick,
}: MobileCardListProps<T>) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: loadingCount }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((item) => {
                const actions = getActions ? getActions(item) : [];

                return (
                    <Card
                        key={keyExtractor(item)}
                        className="relative p-4 hover:border-blue-500 transition-colors"
                        onClick={onCardClick ? () => onCardClick(item) : undefined}
                    >
                        <div className="flex items-start gap-3">
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Title */}
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                    {titleField(item)}
                                </div>

                                {/* Subtitle */}
                                {subtitleField && (
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        {subtitleField(item)}
                                    </div>
                                )}

                                {/* Meta fields */}
                                {metaFields.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {metaFields.map((field, idx) => (
                                            <span
                                                key={idx}
                                                className={`text-xs ${field.className || 'text-slate-500 dark:text-slate-400'}`}
                                            >
                                                {field.render(item)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions Menu */}
                            {actions.length > 0 && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu items={actions} />
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
