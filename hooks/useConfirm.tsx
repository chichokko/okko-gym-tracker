import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const savedResolve = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      savedResolve.current = resolve;
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    savedResolve.current?.(false);
    setState(null);
  }, []);

  const handleConfirm = useCallback(() => {
    savedResolve.current?.(true);
    setState(null);
  }, []);

  const getDialogProps = () => {
    if (!state || !state.isOpen) return null;
    return {
      isOpen: state.isOpen,
      onClose: handleClose,
      onConfirm: handleConfirm,
      title: state.options.title || 'Confirmar',
      message: state.options.message,
      confirmLabel: state.options.confirmLabel,
      cancelLabel: state.options.cancelLabel,
      variant: state.options.variant,
    };
  };

  return { confirm, getDialogProps, isOpen: !!state?.isOpen };
}
