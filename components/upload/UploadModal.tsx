"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MediaUploader } from "./MediaUploader";
import { UrlUploader } from "./UrlUploader";
import { FigmaUploader } from "./FigmaUploader";
import { cn } from "@/lib/utils";

type Tab = "media" | "url" | "figma";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "media", label: "Media", emoji: "🖼️" },
  { id: "url", label: "Website", emoji: "🌐" },
  { id: "figma", label: "Figma", emoji: "✦" },
];

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: () => void;
}

export function UploadModal({ open, onClose, defaultProjectId, onSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("media");

  function handleSuccess() {
    onSuccess?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-semibold">Upload artifact</h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)] px-5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                    activeTab === tab.id
                      ? "border-[var(--foreground)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === "media" && (
                <MediaUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
              {activeTab === "url" && (
                <UrlUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
              {activeTab === "figma" && (
                <FigmaUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
