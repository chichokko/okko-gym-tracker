import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children
}) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end">
                    <motion.div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border border-b-0 border-gray-200 dark:border-slate-800 flex flex-col"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        </div>
                        {title && (
                            <div className="flex items-center justify-between px-4 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                                <IconButton onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-slate-800">
                                    <X size={20} />
                                </IconButton>
                            </div>
                        )}
                        <div className="px-4 pb-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
