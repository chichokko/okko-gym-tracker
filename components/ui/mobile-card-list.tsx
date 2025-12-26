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
        <div className="space-y-4">
            {data.map((item) => {
                const actions = getActions ? getActions(item) : [];

                return (
                    <Card
                        key={keyExtractor(item)}
                        className="relative flex flex-col justify-between hover:border-blue-500 transition-all cursor-pointer group"
                        onClick={onCardClick ? () => onCardClick(item) : undefined}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg md:text-xl text-slate-900 dark:text-white line-clamp-1 pr-8">
                                    {titleField(item)}
                                </div>
                                {/* Actions Menu Positioned Absolute top-right */}
                                {actions.length > 0 && (
                                    <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 z-10">
                                        <DropdownMenu items={actions} />
                                    </div>
                                )}
                            </div>

                            {/* Subtitle */}
                            {subtitleField && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-medium">
                                    {subtitleField(item)}
                                </div>
                            )}

                            {/* Meta fields */}
                            {metaFields.length > 0 && (
                                <div className="space-y-1 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                    {metaFields.map((field, idx) => (
                                        <div key={idx} className={`text-sm ${field.className || 'text-slate-600 dark:text-slate-300'}`}>
                                            {field.render(item)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
