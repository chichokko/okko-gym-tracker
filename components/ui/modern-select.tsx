import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { Drawer } from './drawer';

export interface ModernSelectOption {
    value: string;
    label: string;
    leading?: React.ReactNode;
}

interface ModernSelectProps {
    value: string;
    options: ModernSelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
    value,
    options,
    onChange,
    placeholder,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'mobile' | 'desktop'>('desktop');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 220 });

    const selected = options.find(o => o.value === value);

    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current?.contains(event.target as Node)) return;
            if (mode === 'desktop' && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                close();
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        const handleReposition = () => close();
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [isOpen, close, mode]);

    const openMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        setMode(isMobile ? 'mobile' : 'desktop');

        if (!isMobile) {
            const width = Math.min(280, Math.max(rect.width, 220));
            const estimatedHeight = options.length * 44 + 8;
            const top = rect.bottom + 4 + estimatedHeight > window.innerHeight
                ? Math.max(8, rect.top - estimatedHeight - 4)
                : rect.bottom + 4;
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
            setPosition({ top, left, width });
        }
        setIsOpen(true);
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        close();
    };

    const optionList = (isDrawer: boolean) => (
        <>
            {options.map(option => {
                const isSelected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={
                            isDrawer
                                ? `w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`
                                : `w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
                        }
                    >
                        {option.leading}
                        <span className={`flex-1 truncate ${isDrawer ? 'text-sm font-medium' : ''} ${isSelected && !isDrawer ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                            {option.label}
                        </span>
                        {isSelected && <Check size={isDrawer ? 18 : 16} className="text-blue-600 flex-shrink-0" />}
                    </button>
                );
            })}
        </>
    );

    return (
        <>
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (isOpen ? close() : openMenu())}
                className={`h-12 w-full px-4 rounded-lg bg-gray-50 border border-gray-200 text-left flex items-center gap-3 transition-all outline-none dark:bg-slate-800 dark:border-slate-700 ${isOpen ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'hover:border-blue-400'} ${className || ''}`}
            >
                {selected?.leading}
                <span className={`flex-1 truncate text-sm ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selected?.label || placeholder || 'Seleccionar...'}
                </span>
                <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile: bottom sheet */}
            {isOpen && mode === 'mobile' && (
                <Drawer isOpen={isOpen} onClose={close}>
                    <div className="space-y-1 pb-2">{optionList(true)}</div>
                </Drawer>
            )}

            {/* Desktop: portal popover */}
            {isOpen && mode === 'desktop' && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 100, width: position.width }}
                    className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 animate-in fade-in zoom-in-95 duration-150"
                >
                    {optionList(false)}
                </div>,
                document.body
            )}
        </>
    );
};
