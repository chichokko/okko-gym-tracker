import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { IconButton } from '../../ui';
import { Logo } from '../shared/Logo';

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
        <Logo variant="horizontal" className="w-28" />
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
