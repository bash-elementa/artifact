"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArtifactCard } from "@/components/projects/ArtifactCard";
import { ArtifactLightbox } from "@/components/explore/ArtifactLightbox";
import { UploadModal, type UploadType } from "@/components/upload/UploadModal";

interface Artifact {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  isSharedToFeed: boolean;
  isShareable: boolean;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  sourceUrl?: string | null;
  sourceCredit?: string | null;
  createdAt: string;
  reactions: { emoji: string }[];
  user: { id: string; name: string; role: string; team: string; image: string | null };
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  artifacts: Artifact[];
  _count: { artifacts: number };
}

const STEPS = 6;
const STEP_PX = 40;
const TRACK_W = (STEPS - 1) * STEP_PX; // 200px
const THUMB = 32;

const SPRING = { type: "spring" as const, stiffness: 70, damping: 5, mass: 1.6 };

function ColumnSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const x = useMotionValue((value - 1) * STEP_PX);
  const displayValue = useTransform(x, (v) => Math.round(Math.max(0, Math.min(TRACK_W, v)) / STEP_PX) + 1);
  const isDragging = useRef(false);

  // Only snap externally when not mid-drag
  useEffect(() => {
    if (isDragging.current) return;
    animate(x, (value - 1) * STEP_PX, SPRING);
  }, [value, x]);

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDrag() {
    const raw = Math.max(0, Math.min(TRACK_W, x.get()));
    const newVal = Math.round(raw / STEP_PX) + 1;
    onChange(newVal);
  }

  function handleDragEnd() {
    const raw = Math.max(0, Math.min(TRACK_W, x.get()));
    const step = Math.round(raw / STEP_PX);
    onChange(step + 1);
    animate(x, step * STEP_PX, SPRING);
    isDragging.current = false;
  }

  const PAD = 6;

  return (
    <div className="rounded-full bg-[var(--surface-2)] flex items-center" style={{ padding: PAD, height: THUMB + PAD * 2 }}>
      <div className="relative flex items-center" style={{ width: TRACK_W + THUMB, height: THUMB }}>
        {/* Track line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: THUMB / 2, width: TRACK_W, height: 2, background: "var(--border)" }}
        />
        {/* Dots */}
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--muted)]"
            style={{
              left: i * STEP_PX + THUMB / 2 - 4,
              width: 8, height: 8,
              opacity: 0.45,
            }}
          />
        ))}
        {/* Thumb */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: TRACK_W }}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x, left: 0, width: THUMB, height: THUMB }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.12 }}
          className="absolute top-1/2 -translate-y-1/2 rounded-2xl bg-[var(--foreground)] shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 select-none"
        >
          <motion.span className="text-[11px] font-bold text-[var(--background)] pointer-events-none">
            {displayValue}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Upload dropdown ────────────────────────────────────────────────────────────

const UPLOAD_OPTIONS: { type: UploadType; label: string; icon: React.JSX.Element }[] = [
  { type: "media", label: "Media", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )},
  { type: "url", label: "URL", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )},
  { type: "figma", label: "Figma", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z"/>
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
    </svg>
  )},
];

function AddButton({ onPick }: { onPick: (type: UploadType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-11 h-11 rounded-full bg-[var(--foreground)] text-[var(--background)] text-2xl leading-none flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
        aria-label="Add artifact"
      >
        +
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 rounded-2xl shadow-xl overflow-hidden z-50"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 180 }}
          >
            <div className="p-1.5">
              {UPLOAD_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => { setOpen(false); onPick(opt.type); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors text-left"
                >
                  <span className="text-[var(--muted)]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<Artifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const [columns, setColumns] = useState(3);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      setProject(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  function openLightbox(artifact: Artifact) {
    const idx = project?.artifacts.findIndex((a) => a.id === artifact.id) ?? 0;
    setLightboxIndex(idx);
    setLightboxArtifact(artifact);
  }

  function navigateLightbox(dir: -1 | 1) {
    if (!project) return;
    const next = lightboxIndex + dir;
    if (next < 0 || next >= project.artifacts.length) return;
    setLightboxIndex(next);
    setLightboxArtifact(project.artifacts[next]);
  }

  function handleDelete(id: string) {
    setProject((prev) =>
      prev ? { ...prev, artifacts: prev.artifacts.filter((a) => a.id !== id) } : prev
    );
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface-2)] animate-pulse mb-8" />
        <div className="columns-3 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-[var(--surface-2)] animate-pulse"
              style={{ height: [220, 300, 180, 260, 240, 200, 280, 220][i] }} />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[var(--muted)]">Project not found.</p>
        <Link href="/projects" className="mt-4 text-sm text-[var(--accent)] underline">Back to Projects</Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-6 pt-24 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-8">
          <Link href="/projects" className="hover:text-[var(--foreground)] transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-medium">{project.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 gap-1.5">
          <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {project._count.artifacts} {project._count.artifacts === 1 ? "artifact" : "artifacts"}
          </p>
        </div>

        {/* Slider + Upload button */}
        {project.artifacts.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <ColumnSlider value={columns} onChange={setColumns} />
            <AddButton onPick={setUploadType} />
          </div>
        )}

        {/* Masonry grid */}
        {project.artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🗂️</div>
            <div>
              <p className="text-base font-medium">No artifacts yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">Hit the + button above to upload your first artifact.</p>
            </div>
            <AddButton onPick={setUploadType} />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div
              className="gap-3 transition-all duration-300"
              style={{ columnCount: columns, columnGap: 12 }}
            >
              {project.artifacts.map((artifact) => (
                <div key={artifact.id} className="break-inside-avoid mb-3">
                  <ArtifactCard
                    artifact={artifact}
                    onClick={() => openLightbox(artifact)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxArtifact(null)}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={project && lightboxIndex < project.artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
      />

      <UploadModal
        open={uploadType !== null}
        type={uploadType ?? "media"}
        onClose={() => setUploadType(null)}
        defaultProjectId={projectId}
        onSuccess={loadProject}
      />
    </>
  );
}
