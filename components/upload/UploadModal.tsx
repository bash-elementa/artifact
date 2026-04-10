"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MediaUploader } from "./MediaUploader";
import { UrlUploader } from "./UrlUploader";
import { FigmaUploader } from "./FigmaUploader";

export type UploadType = "media" | "url" | "figma";

const TYPE_TITLES: Record<UploadType, string> = {
  media: "Upload Files",
  url: "Add website URL",
  figma: "Add Figma",
};

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  type?: UploadType;
  defaultProjectId?: string;
  onSuccess?: () => void;
}

export function UploadModal({ open, onClose, type = "media", defaultProjectId, onSuccess }: UploadModalProps) {
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--surface)] shadow-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{TYPE_TITLES[type]}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {type === "media" && (
                <MediaUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
              {type === "url" && (
                <UrlUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
              {type === "figma" && (
                <FigmaUploader defaultProjectId={defaultProjectId} onSuccess={handleSuccess} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
