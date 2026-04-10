"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  artifacts: {
    id: string;
    mediaUrl?: string | null;
    figmaPreviewUrl?: string | null;
    screenshotUrl?: string | null;
    type: string;
    name: string;
  }[];
  _count: { artifacts: number };
}

export function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleNewProject(project: { id: string; name: string }) {
    loadProjects();
    setNewProjectOpen(false);
    void project;
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Projects</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Your private workspace</p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface-2)] aspect-[4/3] animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
            ))}
            {/* New project tile */}
            <button
              onClick={() => setNewProjectOpen(true)}
              className="group rounded-2xl aspect-[4/3] bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--surface)] transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-3xl text-[var(--border)] group-hover:text-[var(--muted)] transition-colors duration-200">+</span>
            </button>
          </div>
        </AnimatePresence>
      )}

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={handleNewProject}
      />

    </div>
  );
}
