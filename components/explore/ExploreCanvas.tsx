"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TransformWrapper,
  TransformComponent,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { motion, animate, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { SquaresFour, Compass, Funnel } from "@phosphor-icons/react";
import { ArtifactTile } from "./ArtifactTile";
import { ArtifactLightbox } from "./ArtifactLightbox";
import { ReactionBar } from "@/components/reactions/ReactionBar";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { TAG_CONFIG } from "@/lib/tag-config";
import { TourModal } from "@/components/tour/TourModal";

interface FeedArtifact {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  screenSize?: string | null;
  tags: string[];
  isSharedToFeed: boolean;
  createdAt: string;
  reactionCounts: Record<string, number>;
  myReactions: string[];
  user: {
    id: string;
    name: string;
    role?: string | null;
    team?: string | null;
    image?: string | null;
  };
}

const VIEWPORT_BUFFER = 400;
const COLUMN_COUNT = 5;
const COLUMN_WIDTH = 280;
const COLUMN_GAP = 16;
const ITEM_GAP = 16;
const PADDING = 24;
const FALLBACK_HEIGHTS = [220, 300, 240, 280, 200, 260, 320, 180, 250, 210];

type Dims = Record<string, { w: number; h: number }>;
type LayoutItem = { artifact: FeedArtifact; x: number; y: number; width: number; height: number };
type Layout = { items: LayoutItem[]; canvasWidth: number; canvasHeight: number };

// Fast seeded RNG (mulberry32)
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function looksLikeVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.includes("videodelivery.net") ||
    lower.includes("cloudflarestream.com") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m3u8")
  );
}

function previewUrl(a: FeedArtifact): string | null {
  if (a.type === "MEDIA") {
    const isVideo =
      a.mediaMimeType?.startsWith("video/") || (!!a.mediaUrl && looksLikeVideo(a.mediaUrl));
    if (isVideo) {
      if (a.screenshotUrl) return a.screenshotUrl;
      const uid = (a.mediaUrl ?? "").match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i)?.[1];
      if (uid) return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
      return null;
    }
    return a.mediaUrl ?? null;
  }
  if (a.type === "FIGMA") return a.figmaPreviewUrl ?? null;
  if (a.type === "URL") {
    const hasVideo =
      a.mediaMimeType?.startsWith("video/") || (!!a.mediaUrl && looksLikeVideo(a.mediaUrl));
    if (hasVideo && a.mediaUrl) return a.mediaUrl;
    return a.screenshotUrl ?? null;
  }
  // HTML, REACT — use the screenshot
  return a.screenshotUrl ?? null;
}

function layoutArtifacts(artifacts: FeedArtifact[], dims: Dims, seed: number): Layout {
  if (artifacts.length === 0) return { items: [], canvasWidth: 1200, canvasHeight: 600 };

  const rng = makeRng(seed);

  // Shuffle so new artifacts don't always append to the same column
  const shuffled = [...artifacts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const columnHeights = Array(COLUMN_COUNT).fill(PADDING);
  const items: LayoutItem[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const a = shuffled[i];
    const col = columnHeights.indexOf(Math.min(...columnHeights));
    const x = PADDING + col * (COLUMN_WIDTH + COLUMN_GAP);
    const y = columnHeights[col];

    const d = dims[a.id];
    const raw = d ? Math.round(COLUMN_WIDTH * d.h / d.w) : FALLBACK_HEIGHTS[i % FALLBACK_HEIGHTS.length];
    const height = Math.max(160, Math.min(480, raw));

    items.push({ artifact: a, x, y, width: COLUMN_WIDTH, height });
    columnHeights[col] += height + ITEM_GAP;
  }

  const canvasWidth = PADDING * 2 + COLUMN_COUNT * COLUMN_WIDTH + (COLUMN_COUNT - 1) * COLUMN_GAP;
  const canvasHeight = Math.max(...columnHeights) + PADDING;

  return { items, canvasWidth, canvasHeight };
}

async function loadDimensions(artifacts: FeedArtifact[]): Promise<Dims> {
  const results = await Promise.all(
    artifacts.map((a) => {
      const url = previewUrl(a);
      if (!url) return Promise.resolve({ id: a.id, w: 4, h: 3 });
      return new Promise<{ id: string; w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ id: a.id, w: img.naturalWidth || 4, h: img.naturalHeight || 3 });
        img.onerror = () => resolve({ id: a.id, w: 4, h: 3 });
        img.src = url;
      });
    })
  );
  const dims: Dims = {};
  for (const r of results) dims[r.id] = { w: r.w, h: r.h };
  return dims;
}

function VirtualizedTiles({ layout, onTileClick, onReact }: { layout: Layout; onTileClick: (a: FeedArtifact) => void; onReact: (artifactId: string, emoji: string, action: "added" | "removed") => void }) {
  const [viewport, setViewport] = useState({
    x: 0, y: 0,
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useTransformEffect(({ state }) => {
    const { positionX, positionY, scale } = state;
    setViewport({
      x: -positionX / scale,
      y: -positionY / scale,
      w: (typeof window !== "undefined" ? window.innerWidth : 1440) / scale,
      h: (typeof window !== "undefined" ? window.innerHeight : 900) / scale,
    });
  });

  const visible = useMemo(
    () =>
      layout.items.filter(
        ({ x, y, width, height }) =>
          x + width > viewport.x - VIEWPORT_BUFFER &&
          x < viewport.x + viewport.w + VIEWPORT_BUFFER &&
          y + height > viewport.y - VIEWPORT_BUFFER &&
          y < viewport.y + viewport.h + VIEWPORT_BUFFER
      ),
    [layout, viewport]
  );

  return (
    <>
      {visible.map(({ artifact, x, y, width, height }) => (
        <ArtifactTile
          key={artifact.id}
          artifact={artifact}
          style={{ left: x, top: y, width, height }}
          onClick={() => onTileClick(artifact)}
          onReact={(emoji, action) => onReact(artifact.id, emoji, action)}
        />
      ))}
    </>
  );
}

// ── Grid column slider ───────────────────────────────────────────────────────
const GRID_STEPS = 5; // 2–6 columns
const GRID_STEP_PX = 20;
const GRID_TRACK_W = (GRID_STEPS - 1) * GRID_STEP_PX; // 80px
const GRID_THUMB = 22;
const GRID_SPRING = { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 };

function GridColumnSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const x = useMotionValue((value - 2) * GRID_STEP_PX);
  const displayValue = useTransform(x, (v) => Math.round(Math.max(0, Math.min(GRID_TRACK_W, v)) / GRID_STEP_PX) + 2);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isDragging.current) return;
    animate(x, (value - 2) * GRID_STEP_PX, GRID_SPRING);
  }, [value, x]);

  return (
    <div className="flex items-center" style={{ width: GRID_TRACK_W + GRID_THUMB, height: GRID_THUMB }}>
      <div className="relative flex items-center w-full h-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: GRID_THUMB / 2, width: GRID_TRACK_W, height: 2, background: "var(--border)" }}
        />
        {Array.from({ length: GRID_STEPS }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{ left: i * GRID_STEP_PX + GRID_THUMB / 2 - 3, width: 6, height: 6, background: "var(--muted)", opacity: 0.4 }}
          />
        ))}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: GRID_TRACK_W }}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x, left: 0, width: GRID_THUMB, height: GRID_THUMB, background: "var(--foreground-solid)" }}
          onDragStart={() => { isDragging.current = true; }}
          onDrag={() => {
            const raw = Math.max(0, Math.min(GRID_TRACK_W, x.get()));
            onChange(Math.round(raw / GRID_STEP_PX) + 2);
          }}
          onDragEnd={() => {
            const step = Math.round(Math.max(0, Math.min(GRID_TRACK_W, x.get())) / GRID_STEP_PX);
            onChange(step + 2);
            animate(x, step * GRID_STEP_PX, GRID_SPRING);
            isDragging.current = false;
          }}
          whileDrag={{ scale: 1.12 }}
          className="absolute top-1/2 -translate-y-1/2 rounded-xl shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 select-none"
        >
          <motion.span className="text-[9px] font-bold pointer-events-none" style={{ color: "var(--background)" }}>
            {displayValue}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function FloatingTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        {label}
      </div>
    </div>
  );
}

export function ExploreCanvas() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("artifact");
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>([]);
  const [dims, setDims] = useState<Dims>({});
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"canvas" | "grid">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("explore-view-mode");
      if (stored === "grid" || stored === "canvas") return stored;
    }
    return "canvas";
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<"work" | "inspo" | null>(null);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = parseInt(localStorage.getItem("explore-grid-columns") ?? "", 10);
      if (stored >= 2 && stored <= 6) return stored;
    }
    return 4;
  });
  const [showTour, setShowTour] = useState(false);
  // Always derive lightbox artifact from live artifacts array so reactions stay in sync
  const lightboxArtifact = lightboxOpen ? (artifacts[lightboxIndex] ?? null) : null;
  const sessionSeed = useRef(Math.floor(Math.random() * 1000000));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("explore-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("explore-grid-columns", String(gridColumns));
  }, [gridColumns]);

  useEffect(() => {
    fetch(`/api/feed?seed=${sessionSeed.current}`)
      .then((r) => r.json())
      .then(async (data: unknown) => {
        const items = Array.isArray(data) ? (data as FeedArtifact[]) : [];
        setArtifacts(items);
        const d = await loadDimensions(items);
        setDims(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Show tour for users who just completed onboarding
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("show-tour") === "1") {
      localStorage.removeItem("show-tour");
      setShowTour(true);
    }
  }, []);

  // Auto-open lightbox from deep-link ?artifact=ID
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!deepLinkId || deepLinkHandled.current || artifacts.length === 0) return;
    const idx = artifacts.findIndex((a) => a.id === deepLinkId);
    if (idx >= 0) {
      deepLinkHandled.current = true;
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  }, [deepLinkId, artifacts]);

  const uniqueTeams = useMemo(
    () => [...new Set(artifacts.map((a) => a.user?.team).filter(Boolean) as string[])].sort(),
    [artifacts]
  );

  const filteredArtifacts = useMemo(
    () => artifacts.filter((a) => {
      if (activeTag && !a.tags?.includes(activeTag)) return false;
      if (activeTeam && a.user?.team !== activeTeam) return false;
      return true;
    }),
    [artifacts, activeTag, activeTeam]
  );

  const layout = useMemo(
    () => layoutArtifacts(filteredArtifacts, dims, sessionSeed.current),
    [filteredArtifacts, dims]
  );

  // Centre viewport on the artifact cluster — on initial load and whenever switching back to canvas
  useEffect(() => {
    if (viewMode !== "canvas") return;
    if (!transformRef.current || layout.items.length === 0) return;

    const vmin = Math.min(window.innerWidth, window.innerHeight) * 0.1;
    const posX = window.innerWidth / 2 + vmin - layout.canvasWidth / 2;
    const posY = window.innerHeight / 2 + vmin - layout.canvasHeight / 2;
    transformRef.current.setTransform(posX, posY, 1, 0);
  }, [layout, viewMode]);

  const handleReact = useCallback((artifactId: string, emoji: string, action: "added" | "removed") => {
    setArtifacts((prev) =>
      prev.map((a) => {
        if (a.id !== artifactId) return a;
        const newCounts = { ...a.reactionCounts };
        const newMine = [...a.myReactions];
        if (action === "added") {
          newCounts[emoji] = (newCounts[emoji] ?? 0) + 1;
          if (!newMine.includes(emoji)) newMine.push(emoji);
        } else {
          newCounts[emoji] = Math.max(0, (newCounts[emoji] ?? 0) - 1);
          if (newCounts[emoji] === 0) delete newCounts[emoji];
          const i = newMine.indexOf(emoji);
          if (i > -1) newMine.splice(i, 1);
        }
        return { ...a, reactionCounts: newCounts, myReactions: newMine };
      })
    );
  }, []);

  const openLightbox = useCallback(
    (artifact: FeedArtifact) => {
      const idx = artifacts.findIndex((a) => a.id === artifact.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [artifacts]
  );

  function navigateLightbox(dir: -1 | 1) {
    const next = lightboxIndex + dir;
    if (next < 0 || next >= artifacts.length) return;
    setLightboxIndex(next);
  }

  // Close filter popover when clicking outside
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <LoadingDots size={10} gap={8} color="var(--foreground)" jumpHeight={14} />
        <p className="text-sm text-[var(--muted)]">Building artifacts...</p>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-center px-4">
        <div className="text-5xl">🌿</div>
        <div>
          <p className="text-base font-medium">Nothing shared yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Go to Projects, upload some work, and share it to the Explore feed.
          </p>
        </div>
      </div>
    );
  }

  const isFiltered = !!(activeTag || activeTeam);

  // ── Shared floating controls — hidden when lightbox is open ─────────────────
  const FloatingControls = lightboxOpen ? null : (
    <div
      className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-2xl px-2 py-1.5 shadow-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {/* Column slider — only in grid mode, slides out to the left */}
      <AnimatePresence initial={false}>
        {viewMode === "grid" && (
          <motion.div
            key="slider"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden flex items-center gap-2"
          >
            <GridColumnSlider value={gridColumns} onChange={setGridColumns} />
            <div className="w-px h-4 bg-[var(--border)] shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View toggles — sliding active pill */}
      <div className="flex items-center gap-0.5 relative">
        {(["canvas", "grid"] as const).map((mode) => (
          <FloatingTooltip key={mode} label={mode === "canvas" ? "Canvas" : "Grid"}>
            <button
              onClick={() => setViewMode(mode)}
              className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10"
              style={{ color: viewMode === mode ? "var(--background)" : "var(--muted)" }}
            >
              {viewMode === mode && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--foreground)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">
                {mode === "canvas"
                  ? <Compass size={15} weight={viewMode === "canvas" ? "fill" : "regular"} />
                  : <SquaresFour size={15} weight={viewMode === "grid" ? "fill" : "regular"} />
                }
              </span>
            </button>
          </FloatingTooltip>
        ))}
      </div>

      {/* Filter button */}
      <div className="w-px h-4 bg-[var(--border)] shrink-0" />
      <div className="relative" ref={filterRef}>
        <FloatingTooltip label="Filter">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: isFiltered ? "var(--foreground)" : "var(--muted)" }}
          >
            <Funnel size={15} weight={isFiltered ? "fill" : "regular"} />
          </button>
        </FloatingTooltip>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full -right-2 mb-3 rounded-2xl p-3 flex flex-col gap-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Category</p>
                <div className="flex gap-2">
                  {(["work", "inspo"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTag(activeTag === t ? null : t)}
                      className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
                      style={activeTag === t
                        ? { background: TAG_CONFIG[t].bg, color: TAG_CONFIG[t].text, border: "1.5px solid transparent" }
                        : { background: `${TAG_CONFIG[t].bg}18`, color: TAG_CONFIG[t].bg, border: `1.5px solid ${TAG_CONFIG[t].bg}50` }}
                    >
                      {TAG_CONFIG[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {uniqueTeams.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Team</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueTeams.map((team) => (
                      <button
                        key={team}
                        onClick={() => setActiveTeam(activeTeam === team ? null : team)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        style={activeTeam === team
                          ? { background: "var(--accent)", color: "var(--accent-fg)", border: "1px solid transparent" }
                          : { background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFiltered && (
                <button
                  onClick={() => { setActiveTag(null); setActiveTeam(null); }}
                  className="text-xs font-medium text-center transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // ── Grid view ────────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <>
        {/* Scrollable grid — absolute so it fills the parent's overflow-hidden container */}
        <div
          className="absolute inset-0 overflow-y-auto px-6 pb-24"
          style={{ paddingTop: 80 }}
        >
          <div style={{ columnCount: gridColumns, columnGap: 12 }}>
            {filteredArtifacts.map((artifact, i) => {
              const purl = previewUrl(artifact);
              // Derive from purl so the render path always matches the src
              const isVideo = !!purl && looksLikeVideo(purl);

              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.04, 0.6) }}
                  className="break-inside-avoid mb-3 group cursor-pointer rounded-3xl overflow-hidden relative bg-[var(--surface-2)]"
                  style={{ minHeight: 120 }}
                  onClick={() => openLightbox(artifact)}
                >
                  {purl ? (
                    isVideo ? (
                      <video src={purl} autoPlay muted loop playsInline className="w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={purl} alt={artifact.name} className="w-full object-cover transition-opacity duration-200 group-hover:opacity-90" />
                    )
                  ) : (
                    <div className="w-full aspect-[4/3] flex items-center justify-center">
                      <span className="text-4xl opacity-20">
                        {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  {artifact.tags?.[0] && TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG] && (
                    <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold leading-none"
                        style={{
                          background: TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].bg,
                          color: "#fff",
                        }}
                      >
                        {TAG_CONFIG[artifact.tags[0] as keyof typeof TAG_CONFIG].label}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* User pill */}
                      <Link
                        href={`/users/${artifact.user.id}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5 min-w-0 shrink overflow-hidden hover:bg-black/70 transition-colors"
                      >
                        {artifact.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={artifact.user.image} alt={artifact.user.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-white">{artifact.user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-xs font-medium text-white truncate">{artifact.user.name}</span>
                      </Link>
                      {/* Reactions */}
                      <ReactionBar
                        artifactId={artifact.id}
                        reactionCounts={artifact.reactionCounts}
                        myReactions={artifact.myReactions}
                        forceLight
                        onReact={(emoji, action) => handleReact(artifact.id, emoji, action)}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <ArtifactLightbox
          artifact={lightboxArtifact}
          onClose={() => setLightboxOpen(false)}
          onReact={handleReact}
          onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
          onNext={lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
        />

        {FloatingControls}

        <AnimatePresence>
          {showTour && (
            <TourModal
              onDone={() => { localStorage.setItem("tour-seen", "1"); setShowTour(false); }}
              onSkip={() => { localStorage.setItem("tour-seen", "1"); setShowTour(false); }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Canvas view (default) ────────────────────────────────────────────────────
  return (
    <>
      <div
        className="absolute cursor-grab active:cursor-grabbing select-none overflow-hidden"
        style={{ inset: "-10vmin" }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={1}
          limitToBounds={false}
          panning={{ velocityDisabled: false }}
          wheel={{ disabled: true }}
          pinch={{ disabled: true }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{
              width: layout.canvasWidth,
              height: layout.canvasHeight,
              position: "relative",
              willChange: "transform",
            }}
          >
            <VirtualizedTiles layout={layout} onTileClick={openLightbox} onReact={handleReact} />
          </TransformComponent>
        </TransformWrapper>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-xs text-[var(--foreground)] opacity-60 pointer-events-none">
        Drag to explore
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxOpen(false)}
        onReact={handleReact}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={
          lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined
        }
      />

      {FloatingControls}

      <AnimatePresence>
        {showTour && (
          <TourModal
            onDone={() => {
              localStorage.setItem("tour-seen", "1");
              setShowTour(false);
            }}
            onSkip={() => {
              localStorage.setItem("tour-seen", "1");
              setShowTour(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
