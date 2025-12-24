import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { NavItem } from '../shared/NavItem';

interface BottomNavItem {
    label: string;
    icon: any;
    path: string;
}

interface BottomNavProps {
    items: BottomNavItem[];
    onMoreClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, onMoreClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Show max 3 items + "More" button
    const visibleItems = items.slice(0, 3);

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe px-6 py-3 flex justify-around items-center z-40">
            {visibleItems.map((item) => (
                <NavItem
                    key={item.path}
                    label={item.label}
                    icon={item.icon}
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    variant="bottom"
                />
            ))}
            {/* More Button */}
            <button
                onClick={onMoreClick}
                className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
            >
                <MoreHorizontal size={24} strokeWidth={2} />
                <span className="text-[10px] font-medium">Más</span>
            </button>
        </nav>
    );
};
