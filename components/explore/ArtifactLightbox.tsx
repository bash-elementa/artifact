"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Link as PhLink } from "@phosphor-icons/react";
import { UrlRenderer } from "@/components/artifact-renderers/UrlRenderer";
import { FigmaRenderer } from "@/components/artifact-renderers/FigmaRenderer";
import { MediaRenderer } from "@/components/artifact-renderers/MediaRenderer";
import { HtmlRenderer } from "@/components/artifact-renderers/HtmlRenderer";
import { ReactRenderer } from "@/components/artifact-renderers/ReactRenderer";
import { ReactionBar } from "@/components/reactions/ReactionBar";
import { timeAgo } from "@/lib/utils";
import { TAG_CONFIG } from "@/lib/tag-config";

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
  tags?: string[];
  myReactions?: string[];
  reactionCounts?: Record<string, number>;
}

interface ArtifactLightboxProps {
  artifact: LightboxArtifact | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}

function UserAvatar({ user }: { user?: ArtifactUser }) {
  if (!user) return null;
  const initials = user.name?.split(" ").map((n) => n[0]).join("") ?? "?";
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white/60 shrink-0"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
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
      className={`rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors ${className}`}
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {children}
    </button>
  );
}

function CopyLinkButton({ artifactId }: { artifactId: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/share?artifact=${artifactId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      title="Copy link"
      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors shrink-0"
    >
      <PhLink size={13} />
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

// ── Isolated MEDIA lightbox ──────────────────────────────────────────────────

function looksLikeVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.includes("videodelivery.net") ||
    lower.includes("cloudflarestream.com") ||
    lower.endsWith(".m3u8") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

function MediaLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  const isVideo =
    artifact.mediaMimeType?.startsWith("video/") ||
    (!!artifact.mediaUrl && looksLikeVideo(artifact.mediaUrl));
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

      {/* Media — shrinks to content size so the title pill overlays the actual asset */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ padding: "5rem 5rem 6rem" }} // extra bottom padding for the bottom bar
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wrapper shrinks to the rendered image/video size */}
        <div
          className="relative pointer-events-auto max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title pill + tag chip — overlaid on the asset, top-left corner */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <p className="text-xs font-semibold text-white leading-none">{artifact.name}</p>
            </div>
            {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
              <span
                className="px-2.5 py-2 rounded-full text-xs font-semibold leading-none"
                style={{
                  background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                  color: "#fff",
                }}
              >
                {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
              </span>
            )}
          </div>

          {isVideo ? (
            <MediaRenderer
              url={src}
              mimeType={artifact.mediaMimeType ?? "video/mp4"}
              alt={artifact.name}
              maxHeight="calc(100vh - 11rem)"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={artifact.name}
              className="max-w-full max-h-full object-contain rounded-3xl block"
              style={{ maxHeight: "calc(100vh - 11rem)" }}
            />
          )}
        </div>
      </motion.div>

      {/* Close — top right */}
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
          <GlassBtn onClick={onPrev} className="w-10 h-10"><ArrowLeft size={18} /></GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed right-5 top-1/2 -translate-y-1/2 z-50"
        >
          <GlassBtn onClick={onNext} className="w-10 h-10"><ArrowRight size={18} /></GlassBtn>
        </motion.div>
      )}

      {/* Bottom bar — avatar + name + reactions + time */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <ReactionBar forceLight
              artifactId={artifact.id}
              reactionCounts={artifact.reactionCounts ?? {}}
              myReactions={artifact.myReactions ?? []}
              onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
            />
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <CopyLinkButton artifactId={artifact.id} />
          </>
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── URL lightbox — floating chrome bar + iframe, same pattern as MediaLightbox ─

function UrlLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  // Reserve space for bottom pill (~64px) + some breathing room
  const BOTTOM_RESERVED = 80;
  const TOP_RESERVED = 32;
  const SIDE_PADDING = 48;

  // We'll pass maxWidth/maxHeight to UrlRenderer so it scales correctly
  const maxWidth = typeof window !== "undefined"
    ? Math.min(1100, window.innerWidth - SIDE_PADDING * 2)
    : 1100;
  const maxHeight = typeof window !== "undefined"
    ? window.innerHeight - BOTTOM_RESERVED - TOP_RESERVED
    : 700;

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content — centered, no glass container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ paddingBottom: BOTTOM_RESERVED, paddingTop: TOP_RESERVED }}
      >
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <UrlRenderer
            url={artifact.websiteUrl!}
            screenSize={artifact.screenSize}
            screenshotUrl={artifact.screenshotUrl}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
          />
        </div>
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
          <GlassBtn onClick={onPrev} className="w-10 h-10"><ArrowLeft size={18} /></GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed right-5 top-1/2 -translate-y-1/2 z-50"
        >
          <GlassBtn onClick={onNext} className="w-10 h-10"><ArrowRight size={18} /></GlassBtn>
        </motion.div>
      )}

      {/* Bottom bar — avatar + name + reactions + time */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none shrink-0"
              style={{
                background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                color: "#fff",
              }}
            >
              {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
            </span>
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <ReactionBar forceLight
              artifactId={artifact.id}
              reactionCounts={artifact.reactionCounts ?? {}}
              myReactions={artifact.myReactions ?? []}
              onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
            />
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <CopyLinkButton artifactId={artifact.id} />
          </>
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── Figma lightbox ───────────────────────────────────────────────────────────

function FigmaLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  const BOTTOM_RESERVED = 80;
  const TOP_RESERVED = 32;
  const SIDE_PADDING = 24;

  const maxWidth = typeof window !== "undefined"
    ? Math.min(1400, window.innerWidth - SIDE_PADDING * 2)
    : 1200;
  const maxHeight = typeof window !== "undefined"
    ? window.innerHeight - BOTTOM_RESERVED - TOP_RESERVED
    : 700;

  const embedUrl = `https://www.figma.com/embed?embed_host=artifact&url=${encodeURIComponent(artifact.figmaUrl!)}`;

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Figma embed — centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ paddingBottom: BOTTOM_RESERVED, paddingTop: TOP_RESERVED }}
      >
        <div
          className="pointer-events-auto rounded-3xl overflow-hidden"
          style={{
            width: maxWidth,
            height: maxHeight,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {artifact.figmaPreviewUrl ? (
            // Show preview image with overlay embed on top
            <div className="relative w-full h-full bg-[#1e1e1e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artifact.figmaPreviewUrl}
                alt={artifact.name}
                className="absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none"
              />
              <iframe
                src={embedUrl}
                title={artifact.name}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={artifact.name}
              className="w-full h-full"
              allowFullScreen
              style={{ border: "none", background: "#1e1e1e" }}
            />
          )}
        </div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed left-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onPrev} className="w-10 h-10"><ArrowLeft size={18} /></GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed right-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onNext} className="w-10 h-10"><ArrowRight size={18} /></GlassBtn>
        </motion.div>
      )}

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none shrink-0"
              style={{
                background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                color: "#fff",
              }}
            >
              {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
            </span>
          </>
        )}
        {artifact.figmaUrl && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <a
              href={artifact.figmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Open in Figma ↗
            </a>
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <ReactionBar forceLight
              artifactId={artifact.id}
              reactionCounts={artifact.reactionCounts ?? {}}
              myReactions={artifact.myReactions ?? []}
              onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
            />
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <CopyLinkButton artifactId={artifact.id} />
          </>
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── HTML lightbox ────────────────────────────────────────────────────────────

function HtmlLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  const BOTTOM_RESERVED = 80;
  const TOP_RESERVED = 32;
  const SIDE_PADDING = 48;

  const maxWidth = typeof window !== "undefined"
    ? Math.min(1100, window.innerWidth - SIDE_PADDING * 2)
    : 1100;
  const maxHeight = typeof window !== "undefined"
    ? window.innerHeight - BOTTOM_RESERVED - TOP_RESERVED
    : 700;

  // Derive a display filename from the stored URL or artifact name
  const fileName = artifact.name.endsWith(".html") ? artifact.name : `${artifact.name}.html`;

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content — centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ paddingBottom: BOTTOM_RESERVED, paddingTop: TOP_RESERVED }}
      >
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <HtmlRenderer
            url={artifact.mediaUrl!}
            fileName={fileName}
            screenSize={artifact.screenSize}
            screenshotUrl={artifact.screenshotUrl}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
          />
        </div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed left-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onPrev} className="w-10 h-10"><ArrowLeft size={18} /></GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed right-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onNext} className="w-10 h-10"><ArrowRight size={18} /></GlassBtn>
        </motion.div>
      )}

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none shrink-0"
              style={{
                background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                color: "#fff",
              }}
            >
              {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
            </span>
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <ReactionBar forceLight
              artifactId={artifact.id}
              reactionCounts={artifact.reactionCounts ?? {}}
              myReactions={artifact.myReactions ?? []}
              onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
            />
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <CopyLinkButton artifactId={artifact.id} />
          </>
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── React lightbox ───────────────────────────────────────────────────────────

function ReactLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  const BOTTOM_RESERVED = 80;
  const TOP_RESERVED = 32;
  const SIDE_PADDING = 48;

  const maxWidth = typeof window !== "undefined"
    ? Math.min(1100, window.innerWidth - SIDE_PADDING * 2)
    : 1100;
  const maxHeight = typeof window !== "undefined"
    ? window.innerHeight - BOTTOM_RESERVED - TOP_RESERVED
    : 700;

  const fileName = artifact.name.endsWith(".jsx") || artifact.name.endsWith(".tsx")
    ? artifact.name
    : `${artifact.name}.jsx`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ paddingBottom: BOTTOM_RESERVED, paddingTop: TOP_RESERVED }}
      >
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <ReactRenderer
            url={artifact.mediaUrl!}
            fileName={fileName}
            screenSize={artifact.screenSize}
            screenshotUrl={artifact.screenshotUrl}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="fixed top-5 right-5 z-50"
      >
        <GlassBtn onClick={onClose} className="w-9 h-9 text-lg">×</GlassBtn>
      </motion.div>

      {onPrev && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed left-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onPrev} className="w-10 h-10"><ArrowLeft size={18} /></GlassBtn>
        </motion.div>
      )}
      {onNext && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed right-5 top-1/2 -translate-y-1/2 z-50">
          <GlassBtn onClick={onNext} className="w-10 h-10"><ArrowRight size={18} /></GlassBtn>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <UserAvatar user={artifact.user} />
        {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none shrink-0"
              style={{
                background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                color: "#fff",
              }}
            >
              {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
            </span>
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <ReactionBar forceLight
              artifactId={artifact.id}
              reactionCounts={artifact.reactionCounts ?? {}}
              myReactions={artifact.myReactions ?? []}
              onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
            />
          </>
        )}
        {artifact.isSharedToFeed && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />
            <CopyLinkButton artifactId={artifact.id} />
          </>
        )}
        <span className="text-xs text-white/40 shrink-0">{timeAgo(artifact.createdAt)}</span>
      </motion.div>
    </>
  );
}

// ── Container lightbox (INSPO only) ─────────────────────────────────────────

function ContainerLightbox({
  artifact,
  onClose,
  onPrev,
  onNext,
  onReact,
}: {
  artifact: LightboxArtifact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact?: (artifactId: string, emoji: string, action: "added" | "removed") => void;
}) {
  return (
    <>
      {/* Outer: full-screen click-to-close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
      {/* Dialog — stops propagation so clicks inside don't close */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-4 md:inset-8 flex flex-col rounded-3xl glass overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/[0.06]">
          <UserAvatar user={artifact.user} />
          <div className="flex items-center gap-2">
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
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-t border-white/[0.06]">
          <p className="text-sm font-medium text-white truncate flex-1 min-w-0">{artifact.name}</p>
          <div className="flex items-center gap-4 shrink-0 ml-4">
            {artifact.isSharedToFeed && (
              <ReactionBar forceLight
                artifactId={artifact.id}
                reactionCounts={artifact.reactionCounts ?? {}}
                myReactions={artifact.myReactions ?? []}
                onReact={(emoji, action) => onReact?.(artifact.id, emoji, action)}
              />
            )}
            <span className="text-xs text-white/40">{timeAgo(artifact.createdAt)}</span>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export function ArtifactLightbox({ artifact, onClose, onPrev, onNext, onReact }: ArtifactLightboxProps) {
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
  const isUrl   = artifact?.type === "URL"   && !!artifact.websiteUrl;
  const isFigma = artifact?.type === "FIGMA" && !!artifact.figmaUrl;
  const isHtml  = artifact?.type === "HTML"  && !!artifact.mediaUrl;
  const isReact = artifact?.type === "REACT" && !!artifact.mediaUrl;
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
            onReact={onReact}
          />
        ) : isUrl ? (
          <UrlLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
            onReact={onReact}
          />
        ) : isFigma ? (
          <FigmaLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
            onReact={onReact}
          />
        ) : isHtml ? (
          <HtmlLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
            onReact={onReact}
          />
        ) : isReact ? (
          <ReactLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
            onReact={onReact}
          />
        ) : (
          <ContainerLightbox
            key={artifact.id}
            artifact={artifact}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
            onReact={onReact}
          />
        )
      )}
    </AnimatePresence>
  );
}
