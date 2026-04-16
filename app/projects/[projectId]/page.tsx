"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import { Image as PhImage, Link as PhLink, FigmaLogo as PhFigma, Code as PhCode } from "@phosphor-icons/react";
import { DropdownCard, DropdownItem } from "@/components/ui/Dropdown";
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
  figmaNodeWidth?: number | null;
  figmaNodeHeight?: number | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  sourceUrl?: string | null;
  sourceCredit?: string | null;
  createdAt: string;
  reactions: { emoji: string }[];
  user: { id: string; name: string; role: string; team: string; image: string | null };
}

interface Contributor {
  id: string;
  name: string | null;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  artifacts: Artifact[];
  _count: { artifacts: number };
  contributors: Contributor[];
  isOwner: boolean;
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
          style={{ x, left: 0, width: THUMB, height: THUMB, background: "var(--foreground-solid)" }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.12 }}
          className="absolute top-1/2 -translate-y-1/2 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 select-none"
        >
          <motion.span className="text-[11px] font-bold pointer-events-none" style={{ color: "var(--background)" }}>
            {displayValue}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Upload dropdown ────────────────────────────────────────────────────────────

const UPLOAD_OPTIONS: { type: UploadType; label: string; icon: React.JSX.Element }[] = [
  { type: "media", label: "Media",       icon: <PhImage size={16} /> },
  { type: "url",   label: "Website URL", icon: <PhLink size={16} /> },
  { type: "figma", label: "Figma",       icon: <PhFigma size={16} /> },
  { type: "html",  label: "HTML",        icon: <PhCode size={16} /> },
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
          <DropdownCard className="left-1/2 -translate-x-1/2">
            <div className="p-1.5">
              {UPLOAD_OPTIONS.map((opt) => (
                <DropdownItem
                  key={opt.type}
                  icon={opt.icon}
                  label={opt.label}
                  onClick={() => { setOpen(false); onPick(opt.type); }}
                />
              ))}
            </div>
          </DropdownCard>
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
          {project.contributors && project.contributors.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--muted)]">Contributors:</span>
              <div className="flex items-center gap-1.5">
                {project.contributors.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div
                      className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center overflow-hidden shrink-0"
                      style={{ width: 20, height: 20, fontSize: 8, fontWeight: 600 }}
                    >
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.name ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <span>
                          {c.name
                            ? c.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
                            : "?"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted)]">{c.name ?? "Unknown"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Slider + Upload button — desktop only */}
        {project.artifacts.length > 0 && (
          <div className="hidden md:flex items-center justify-center gap-3 mb-8">
            <ColumnSlider value={columns} onChange={setColumns} />
            <AddButton onPick={setUploadType} />
          </div>
        )}

        {/* Mobile: just the add button */}
        {project.artifacts.length > 0 && (
          <div className="flex md:hidden justify-center mb-6">
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
          <div
            className="gap-3 transition-all duration-300"
            style={{ columnCount: isMobile ? 2 : columns, columnGap: 12 }}
          >
            {project.artifacts.map((artifact, i) => (
              <motion.div
                key={artifact.id}
                className="break-inside-avoid mb-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(i * 0.04, 0.6) }}
              >
                <ArtifactCard
                  artifact={artifact}
                  onClick={() => openLightbox(artifact)}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
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
