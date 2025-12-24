// Wrapper around Sonner for consistent API
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

// Re-export Toaster component to be placed in App
export const Toaster = () => (
    <SonnerToaster
        position="bottom-right"
        toastOptions={{
            className: 'font-sans',
            style: {
                background: 'var(--toast-bg, white)',
                border: '1px solid var(--toast-border, #e5e7eb)',
                color: 'var(--toast-text, #1e293b)',
            },
        }}
        richColors
        closeButton
    />
);

// Simple wrapper for toast functions
export const toast = {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    warning: (message: string) => sonnerToast.warning(message),
    info: (message: string) => sonnerToast.info(message),
    loading: (message: string) => sonnerToast.loading(message),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    promise: <T,>(
        promise: Promise<T>,
        options: {
            loading: string;
            success: string;
            error: string;
        }
    ) => sonnerToast.promise(promise, options),
};
