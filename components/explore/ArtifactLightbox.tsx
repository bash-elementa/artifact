"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UrlRenderer } from "@/components/artifact-renderers/UrlRenderer";
import { FigmaRenderer } from "@/components/artifact-renderers/FigmaRenderer";
import { ReactionBar } from "@/components/reactions/ReactionBar";
import { timeAgo } from "@/lib/utils";

interface ArtifactUser {
  id: string;
  name: string;
  role?: string | null;
  team?: string | null;
  image?: string | null;
}

interface LightboxArtifact {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  websiteUrl?: string | null;
  screenSize?: string | null;
  screenshotUrl?: string | null;
  figmaUrl?: string | null;
  figmaPreviewUrl?: string | null;
  sourceUrl?: string | null;
  sourceCredit?: string | null;
  isSharedToFeed?: boolean;
  createdAt: string;
  user?: ArtifactUser;
  myReactions?: string[];
  reactionCounts?: Record<string, number>;
}

interface ArtifactLightboxProps {
  artifact: LightboxArtifact | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function UserAvatar({ user }: { user?: ArtifactUser }) {
  if (!user) return null;
  const initials = user.name?.split(" ").map((n) => n[0]).join("") ?? "?";
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full glass flex items-center justify-center text-xs font-semibold text-[var(--muted)] shrink-0">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : initials}
      </div>
      <div>
        <p className="text-sm font-medium leading-none text-white">{user.name}</p>
        {user.role && <p className="text-xs text-white/50 mt-0.5">{user.role}</p>}
      </div>
    </div>
  );
}

function GlassBtn({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ── Isolated MEDIA lightbox ──────────────────────────────────────────────────

function MediaLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const isVideo = artifact.mediaMimeType?.startsWith("video/");
  const src = artifact.mediaUrl!;

  return (
    <>
      {/* Blurred image backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover scale-125 blur-3xl opacity-50 pointer-events-none"
          />
        </div>
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      {/* Media — centered, isolated */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-20 pointer-events-none"
      >
        {isVideo ? (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={artifact.name}
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </motion.div>

      {/* Close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="fixed top-5 right-5 z-50"
      >
        <GlassBtn onClick={onClose} className="w-9 h-9 text-lg">×</GlassBtn>
      </motion.div>

      {/* Nav arrows */}
      {onPrev && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-5 top-1/2 -translate-y-1/2 z-50"
        >
          <GlassBtn onClick={onPrev} className="w-10 h-10 text-base">←</GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed right-5 top-1/2 -translate-y-1/2 z-50"
        >
          <GlassBtn onClick={onNext} className="w-10 h-10 text-base">→</GlassBtn>
        </motion.div>
      )}

      {/* Info pill — bottom */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-5 py-3 flex items-center gap-5 max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{artifact.name}</p>
          {artifact.description && (
            <p className="text-xs text-white/50 truncate mt-0.5">{artifact.description}</p>
          )}
        </div>
        {artifact.isSharedToFeed && (
          <ReactionBar
            artifactId={artifact.id}
            reactionCounts={artifact.reactionCounts ?? {}}
            myReactions={artifact.myReactions ?? []}
          />
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── Container lightbox (URL / FIGMA / INSPO) ─────────────────────────────────

function ContainerLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-4 md:inset-8 z-50 flex flex-col rounded-3xl glass overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/[0.06]">
          <UserAvatar user={artifact.user} />
          <div className="flex items-center gap-2">
            {artifact.type === "URL" && artifact.websiteUrl && (
              <a
                href={artifact.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full glass px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                Open ↗
              </a>
            )}
            {artifact.type === "FIGMA" && artifact.figmaUrl && (
              <a
                href={artifact.figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full glass px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                Open in Figma ↗
              </a>
            )}
            <GlassBtn onClick={onClose} className="w-8 h-8 text-lg">×</GlassBtn>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto flex items-center justify-center relative">
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 glass w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              ←
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 glass w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              →
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center">
            {artifact.type === "URL" && artifact.websiteUrl && (
              <UrlRenderer
                url={artifact.websiteUrl}
                screenSize={artifact.screenSize}
                screenshotUrl={artifact.screenshotUrl}
              />
            )}
            {artifact.type === "FIGMA" && artifact.figmaUrl && (
              <FigmaRenderer
                figmaUrl={artifact.figmaUrl}
                figmaPreviewUrl={artifact.figmaPreviewUrl}
                name={artifact.name}
              />
            )}
            {artifact.type === "INSPO" && (
              <div className="flex flex-col items-center gap-4 max-w-md text-center">
                {artifact.mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artifact.mediaUrl} alt={artifact.name} className="max-w-full rounded-2xl" />
                )}
                <div className="glass rounded-xl px-4 py-3 text-sm text-yellow-300">
                  💡 Inspo — for reference only
                </div>
                {artifact.sourceUrl && (
                  <a href={artifact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] underline">
                    {artifact.sourceCredit ?? "Source →"}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 shrink-0">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-white">{artifact.name}</p>
            {artifact.description && (
              <p className="text-xs text-white/50">{artifact.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {artifact.isSharedToFeed && (
              <ReactionBar
                artifactId={artifact.id}
                reactionCounts={artifact.reactionCounts ?? {}}
                myReactions={artifact.myReactions ?? []}
              />
            )}
            <span className="text-xs text-white/40">{timeAgo(artifact.createdAt)}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export function ArtifactLightbox({ artifact, onClose, onPrev, onNext }: ArtifactLightboxProps) {
  useEffect(() => {
    if (!artifact) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artifact, onClose, onPrev, onNext]);

  const isMedia = artifact?.type === "MEDIA" && !!artifact.mediaUrl;

  return (
    <AnimatePresence>
      {artifact && (
        isMedia ? (
          <MediaLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
          />
        ) : (
          <ContainerLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
          />
        )
      )}
    </AnimatePresence>
  );
}
