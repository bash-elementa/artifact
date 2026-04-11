"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DropdownCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute top-full mt-2 rounded-2xl shadow-xl overflow-hidden z-50 ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 180 }}
    >
      {children}
    </motion.div>
  );
}

export function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left rounded-xl",
        danger
          ? "hover:bg-[var(--surface-2)]"
          : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
      )}
      style={danger ? { color: "var(--error)" } : undefined}
    >
      <span style={danger ? { color: "var(--error)" } : undefined} className={danger ? "" : "text-[var(--muted)]"}>{icon}</span>
      {label}
    </button>
  );
}
