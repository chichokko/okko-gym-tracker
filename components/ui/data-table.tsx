import React from 'react';
import { Loader2 } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    emptyMessage?: string;
    renderActions?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    emptyMessage = 'No hay datos disponibles.',
    renderActions
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                            {columns.map((col, idx) => (
                                <th
                                    key={col.key}
                                    className={`p-4 font-bold ${idx === 0 ? 'rounded-tl-lg' : ''} ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {renderActions && (
                                <th className="p-4 font-bold text-right rounded-tr-lg">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group"
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`p-4 ${col.className || ''}`}>
                                        {col.render
                                            ? col.render(item)
                                            : String((item as any)[col.key] ?? '')}
                                    </td>
                                ))}
                                {renderActions && (
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {renderActions(item)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="p-8 text-center text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
