import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onValueChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onValueChange,
    onChange,
    placeholder = 'Buscar...',
    className,
    ...props
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onValueChange) {
            onValueChange(e.target.value);
        }
        if (onChange) {
            onChange(e);
        }
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className={`w-full h-12 pl-10 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900 ${className || ''}`}
                {...props}
            />
        </div>
    );
};
