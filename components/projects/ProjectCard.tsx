"use client";

import { useState } from "react";
import Link from "next/link";

interface ProjectPreview {
  id: string;
  mediaUrl?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  type: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  artifacts: ProjectPreview[];
  _count: { artifacts: number };
}

function getPreviewUrl(a: ProjectPreview): string | null {
  if (a.mediaUrl) return a.mediaUrl;
  if (a.figmaPreviewUrl) return a.figmaPreviewUrl;
  if (a.screenshotUrl) return a.screenshotUrl;
  return null;
}

function TypeIcon({ type }: { type: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
      <span className="text-3xl opacity-20">
        {type === "URL" ? "🌐" : type === "FIGMA" ? "✦" : "🖼️"}
      </span>
    </div>
  );
}

function Mosaic({ artifacts }: { artifacts: ProjectPreview[] }) {
  const count = artifacts.length;

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
        <span className="text-4xl opacity-20">📁</span>
      </div>
    );
  }

  if (count === 1) {
    const url = getPreviewUrl(artifacts[0]);
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={artifacts[0].name} className="w-full h-full object-cover" />
    ) : (
      <TypeIcon type={artifacts[0].type} />
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 h-full gap-0.5">
        {artifacts.map((a) => {
          const url = getPreviewUrl(a);
          return url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={a.id} src={url} alt={a.name} className="w-full h-full object-cover" />
          ) : (
            <TypeIcon key={a.id} type={a.type} />
          );
        })}
      </div>
    );
  }

  // 3+ artifacts: large left, 2 stacked right
  const [first, second, third] = artifacts;
  const url1 = getPreviewUrl(first);
  const url2 = getPreviewUrl(second);
  const url3 = getPreviewUrl(third);

  return (
    <div className="grid h-full gap-0.5" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <div className="overflow-hidden row-span-2">
        {url1 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url1} alt={first.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon type={first.type} />
        )}
      </div>
      <div className="overflow-hidden">
        {url2 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url2} alt={second.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon type={second.type} />
        )}
      </div>
      <div className="overflow-hidden">
        {url3 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url3} alt={third.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon type={third.type} />
        )}
      </div>
    </div>
  );
}

export function ProjectCard({ project, onDelete }: { project: Project; onDelete?: (id: string) => void }) {
  const count = project._count.artifacts;
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onDelete?.(project.id);
  }

  return (
    <div className={`group relative${deleting ? " opacity-50 pointer-events-none" : ""}`}>
      <Link href={`/projects/${project.id}`} className="block">
        {/* Image mosaic */}
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[var(--surface-2)] transition-opacity duration-200 group-hover:opacity-90">
          <Mosaic artifacts={project.artifacts.slice(0, 3)} />
        </div>

        {/* Text */}
        <div className="mt-2.5 px-0.5">
          <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">{project.name}</p>
          {project.description && (
            <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{project.description}</p>
          )}
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {count} {count === 1 ? "artifact" : "artifacts"}
          </p>
        </div>
      </Link>

      {/* ··· menu button — shown on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
            className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-white text-xs hover:bg-black/80"
          >
            ···
          </button>
          {menuOpen && (
            <div
              className="absolute top-full right-0 mt-1 w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-10"
              onClick={(e) => e.preventDefault()}
            >
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-[var(--surface-2)] rounded-xl"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
