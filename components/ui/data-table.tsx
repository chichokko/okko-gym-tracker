import React, { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
    pageSize?: number;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    emptyMessage = 'No hay datos disponibles.',
    renderActions,
    pageSize = 10
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

    useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const startEntry = (currentPage - 1) * pageSize + 1;
    const endEntry = Math.min(currentPage * pageSize, data.length);

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
                        {paginatedData.map((item) => (
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

            {data.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800 text-sm text-slate-500">
                    <span>{startEntry}-{endEntry} de {data.length}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                    page === currentPage
                                        ? 'bg-blue-500 text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
