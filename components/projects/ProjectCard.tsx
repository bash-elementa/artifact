"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { timeAgo } from "@/lib/utils";

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

interface ProjectCardProps {
  project: Project;
}

function getPreviewUrl(a: ProjectPreview): string | null {
  if (a.mediaUrl) return a.mediaUrl;
  if (a.figmaPreviewUrl) return a.figmaPreviewUrl;
  if (a.screenshotUrl) return a.screenshotUrl;
  return null;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const previews = project.artifacts.slice(0, 4);
  const count = project._count.artifacts;

  return (
    <Link href={`/projects/${project.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--muted)] transition-all duration-200"
      >
        {/* Preview grid */}
        <div className="grid grid-cols-2 gap-0.5 aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
          {previews.length === 0 ? (
            <div className="col-span-2 row-span-2 flex items-center justify-center">
              <span className="text-4xl opacity-20">📁</span>
            </div>
          ) : (
            previews.map((a) => {
              const url = getPreviewUrl(a);
              return (
                <div key={a.id} className="overflow-hidden bg-[var(--border)]">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={a.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg opacity-30">
                      {a.type === "URL" ? "🌐" : a.type === "FIGMA" ? "✦" : "🖼️"}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Info */}
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">{project.name}</p>
          {project.description && (
            <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{project.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-[var(--muted)]">{count} artifact{count !== 1 ? "s" : ""}</span>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)]">{timeAgo(project.createdAt)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
