import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { NavItem } from '../shared/NavItem';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navItems: Array<{ label: string; icon: any; path: string }>;
    onLogout: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    onClose,
    navItems,
    onLogout
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 lg:hidden" onClick={onClose}>
            <div
                className="absolute right-0 top-0 h-full w-3/4 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-colors animate-in slide-in-from-right"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold">Menú</h2>
                        <button onClick={onClose} className="text-slate-600 dark:text-slate-300">
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="space-y-2 flex-1">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.path}
                                label={item.label}
                                icon={item.icon}
                                isActive={location.pathname === item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    onClose();
                                }}
                            />
                        ))}
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
