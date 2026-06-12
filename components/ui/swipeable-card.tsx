import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';

export interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: SwipeAction;
  onSwipeRight?: SwipeAction;
  threshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}) => {
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });

  const leftOpacity = useTransform(x, [0, -threshold], [0, 1]);
  const rightOpacity = useTransform(x, [0, threshold], [0, 1]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {onSwipeLeft && (
        <motion.div
          className="absolute inset-y-0 right-0 z-0 flex items-center justify-center w-24 rounded-r-xl"
          style={{ backgroundColor: onSwipeLeft.color || '#ef4444', opacity: leftOpacity }}
        >
          <span className="text-white text-sm font-medium flex items-center gap-2 whitespace-nowrap">
            {onSwipeLeft.icon}
            {onSwipeLeft.label}
          </span>
        </motion.div>
      )}
      {onSwipeRight && (
        <motion.div
          className="absolute inset-y-0 left-0 z-0 flex items-center justify-center w-24 rounded-l-xl"
          style={{ backgroundColor: onSwipeRight.color || '#3b82f6', opacity: rightOpacity }}
        >
          <span className="text-white text-sm font-medium flex items-center gap-2 whitespace-nowrap">
            {onSwipeRight.icon}
            {onSwipeRight.label}
          </span>
        </motion.div>
      )}
      <motion.div
        className="relative z-10"
        drag="x"
        dragSnapToOrigin
        dragElastic={0.5}
        style={{ x: springX }}
        whileTap={{ cursor: 'grabbing' }}
        onDragEnd={(_, info) => {
          const offset = info.offset.x;
          if (offset < -threshold && onSwipeLeft) {
            onSwipeLeft.onClick();
          } else if (offset > threshold && onSwipeRight) {
            onSwipeRight.onClick();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
