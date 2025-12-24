import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { IconButton } from '../../ui';

interface MobileHeaderProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    onMenuOpen: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    isDarkMode,
    toggleTheme,
    onMenuOpen
}) => (
    <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
            <span className="text-lg font-bold">OKKO</span>
        </div>
        <div className="flex items-center gap-2">
            <IconButton onClick={toggleTheme}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
            <button onClick={onMenuOpen} className="p-2 text-slate-600 dark:text-slate-300">
                <Menu size={24} />
            </button>
        </div>
    </header>
);
