import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ---------- Ripple Loader ----------

interface RippleLoaderProps {
  size?: number;
  className?: string;
}

export const RippleLoader: React.FC<RippleLoaderProps> = ({ size = 48, className }) => {
  const dotSize = size / 6;
  const stagger = 0.12;

  return (
    <div className={`flex items-center justify-center gap-[${dotSize}px] ${className || ''}`} style={{ gap: dotSize / 2 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block rounded-full bg-blue-500"
          style={{ width: dotSize, height: dotSize }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * stagger,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ---------- Typewriter Text ----------

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 0.05, className, onComplete }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDisplayed(0);
    const chars = text.split('');
    chars.forEach((_, i) => {
      setTimeout(() => {
        setDisplayed(i + 1);
        if (i === chars.length - 1) onComplete?.();
      }, (i + 1) * speed * 1000);
    });
  }, [text, speed, onComplete]);

  return (
    <span className={className} style={{ whiteSpace: 'pre' }}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: i < displayed ? 1 : 0, x: i < displayed ? 0 : -4 }}
          transition={{ duration: 0.15 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// ---------- Confirm Dialog ----------

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
            </div>
            <div className="flex gap-3 px-5 pb-5 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ---------- Clip Wipe Overlay ----------

interface ClipWipeOverlayProps {
  onComplete?: () => void;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export const ClipWipeOverlay: React.FC<ClipWipeOverlayProps> = ({
  onComplete,
  direction = 'right',
  duration = 0.9,
}) => {
  const clipPathStart = useMemo(() => {
    switch (direction) {
      case 'right': return 'inset(0% 100% 0% 0%)';
      case 'left': return 'inset(0% 0% 0% 100%)';
      case 'up': return 'inset(100% 0% 0% 0%)';
      case 'down': return 'inset(0% 0% 100% 0%)';
      default: return 'inset(0% 100% 0% 0%)';
    }
  }, [direction]);

  const clipPathEnd = useMemo(() => {
    switch (direction) {
      case 'right': return 'inset(0% 0% 0% 0%)';
      case 'left': return 'inset(0% 0% 0% 0%)';
      case 'up': return 'inset(0% 0% 0% 0%)';
      case 'down': return 'inset(0% 0% 0% 0%)';
      default: return 'inset(0% 0% 0% 0%)';
    }
  }, [direction]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-blue-600"
      initial={{ clipPath: clipPathEnd }}
      animate={{ clipPath: clipPathStart }}
      exit={{ clipPath: clipPathEnd }}
      transition={{ duration, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={onComplete}
    />
  );
};

// ---------- Pixels Overlay ----------

interface PixelsOverlayProps {
  onComplete?: () => void;
  duration?: number;
  size?: number;
  noise?: number;
}

export const PixelsOverlay: React.FC<PixelsOverlayProps> = ({
  onComplete,
  duration = 0.2,
  size = 25,
  noise = 0.7,
}) => {
  const cols = size;
  const rows = Math.min(Math.round(size * 1.5), 80);
  const total = cols * rows;
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= total) {
      onComplete?.();
    }
  }, [doneCount, total, onComplete]);

  const delays = useMemo(() => {
    const d: number[] = [];
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const centerDist = Math.abs(col - cols / 2) + Math.abs(row - rows / 2);
      const maxDist = cols / 2 + rows / 2;
      const normalized = centerDist / maxDist;
      d.push(normalized * duration * 2 + Math.random() * noise * duration);
    }
    return d;
  }, [total, cols, rows, duration, noise]);

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-blue-600"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{
            duration,
            delay: delays[i],
            ease: 'easeOut',
          }}
          onAnimationComplete={() => setDoneCount(prev => prev + 1)}
        />
      ))}
    </div>
  );
};
