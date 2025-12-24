import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import { User } from '../../../types';
import { NavItem } from '../shared/NavItem';
import { IconButton } from '../../ui';

interface SidebarProps {
    user: User;
    navItems: Array<{ label: string; icon: any; path: string }>;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    user,
    navItems,
    onLogout,
    isDarkMode,
    toggleTheme
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen sticky top-0 p-6 z-20">
            {/* Logo */}
            <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
                    <span className="text-xl font-bold tracking-tight">OKKO</span>
                </div>
                <IconButton onClick={toggleTheme}>
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
            </div>

            {/* Navigation */}
            <div className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        label={item.label}
                        icon={item.icon}
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </div>

            {/* User Section */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl
                            ? <img src={user.avatarUrl} alt="User" />
                            : <span className="text-gray-500 dark:text-gray-300 font-bold">{user.name[0]}</span>
                        }
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {user.role === 'COACH' ? 'Entrenador' : 'Alumno'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};
