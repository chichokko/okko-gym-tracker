import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, LucideIcon } from 'lucide-react';

interface DropdownMenuItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
    items: DropdownMenuItem[];
    trigger?: React.ReactNode;
}

const MENU_WIDTH = 160;
const MENU_ITEM_HEIGHT = 44;

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, trigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current?.contains(event.target as Node)) return;
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                close();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, close]);

    useEffect(() => {
        if (!isOpen) return;
        const handleReposition = () => close();
        document.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            document.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [isOpen, close]);

    const openMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const estimatedHeight = items.length * MENU_ITEM_HEIGHT + 8;
        const top = rect.bottom + 4 + estimatedHeight > window.innerHeight
            ? Math.max(8, rect.top - estimatedHeight - 4)
            : rect.bottom + 4;
        const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));

        setPosition({ top, left });
        setIsOpen(true);
    };

    return (
        <div className="relative inline-flex" ref={triggerRef}>
            {/* Trigger */}
            <button
                onClick={() => (isOpen ? close() : openMenu())}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
                {trigger || <MoreVertical size={20} />}
            </button>

            {/* Dropdown rendered via portal so it's never clipped by parent containers */}
            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 100 }}
                    className="min-w-[160px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 animate-in fade-in zoom-in-95 duration-150"
                >
                    {items.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    item.onClick();
                                    close();
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${item.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                                        : 'text-slate-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {Icon && <Icon size={16} />}
                                {item.label}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};
