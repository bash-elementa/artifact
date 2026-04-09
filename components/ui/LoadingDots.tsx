"use client";

import { motion, type Variants } from "framer-motion";

const dotVariants: Variants = {
  jump: {
    y: -12,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    },
  },
};

interface LoadingDotsProps {
  /** Size of each dot in px. Default: 8 */
  size?: number;
  /** Gap between dots in px. Default: 6 */
  gap?: number;
  /** Dot color — any valid CSS color. Default: currentColor */
  color?: string;
  /** How far each dot jumps up in px. Default: 12 */
  jumpHeight?: number;
}

export function LoadingDots({
  size = 8,
  gap = 6,
  color = "currentColor",
  jumpHeight = 12,
}: LoadingDotsProps) {
  const variants: Variants = {
    jump: {
      y: -jumpHeight,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      animate="jump"
      transition={{ staggerChildren: -0.15, staggerDirection: -1 }}
      style={{ display: "flex", alignItems: "center", gap }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={variants}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
      ))}
    </motion.div>
  );
}
