"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TourModal } from "@/components/tour/TourModal";

// ── Page (standalone preview) ─────────────────────────────────────────────────

export default function TourPage() {
  const [open, setOpen] = useState(true);
  const [exiting, setExiting] = useState(false);

  function handleDone() {
    setExiting(true);
    setTimeout(() => { window.location.href = "/explore"; }, 600);
  }

  function handleSkip() {
    setOpen(false);
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[var(--background)]"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(4,4,4,0.12) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Simulated content behind modal */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none select-none">
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>← Explore behind here</p>
      </div>

      {/* Reopen button (for standalone preview only) */}
      {!open && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Reopen tour
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <TourModal onDone={handleDone} onSkip={handleSkip} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exiting && (
          <motion.div
            className="absolute inset-0 z-[60]"
            style={{ background: "var(--background)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
