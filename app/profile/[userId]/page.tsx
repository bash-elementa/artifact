"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ArtifactCard } from "@/components/projects/ArtifactCard";
import { ArtifactLightbox } from "@/components/explore/ArtifactLightbox";

interface Artifact {
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
  isSharedToFeed: boolean;
  isShareable: boolean;
  createdAt: string;
  myReactions?: string[];
  reactionCounts?: Record<string, number>;
  reactions: { emoji: string; userId: string }[];
  user: { id: string; name: string; role?: string | null; team?: string | null; image?: string | null };
}

interface ProfileUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  team?: string | null;
  bio?: string | null;
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<Artifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch user profile and their shared artifacts
        const [userRes, artifactsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/artifacts?userId=${userId}&shared=true`),
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (artifactsRes.ok) {
          const data: Artifact[] = await artifactsRes.json();
          // Annotate reactions for current user
          const annotated = data.map((a) => ({
            ...a,
            myReactions: a.reactions.filter((r) => r.userId === userId).map((r) => r.emoji),
            reactionCounts: a.reactions.reduce((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          }));
          setArtifacts(annotated);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  function openLightbox(artifact: Artifact) {
    const idx = artifacts.findIndex((a) => a.id === artifact.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxArtifact(artifact);
  }

  function navigateLightbox(dir: -1 | 1) {
    const next = lightboxIndex + dir;
    if (next < 0 || next >= artifacts.length) return;
    setLightboxIndex(next);
    setLightboxArtifact(artifacts[next]);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-10">
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] animate-pulse" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 w-40 rounded-lg bg-[var(--surface)] animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-[var(--surface)] animate-pulse" />
          </div>
        </div>
        <div className="columns-2 md:columns-3 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-[var(--surface-2)] animate-pulse"
              style={{ height: [220, 300, 180, 260, 240, 200, 280, 220][i] }} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[var(--muted)]">User not found.</p>
        <Link href="/explore" className="mt-4 text-sm text-[var(--accent)] underline">Back to Explore</Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-10">
        {/* Profile header */}
        <div className="mb-10">
          <ProfileCard user={user} artifactCount={artifacts.length} />
        </div>

        {/* Artifacts masonry grid */}
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="text-4xl opacity-30">🌿</div>
            <p className="text-sm text-[var(--muted)]">No shared artifacts yet.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 gap-3">
            {artifacts.map((artifact) => (
              <div key={artifact.id} className="break-inside-avoid mb-3">
                <ArtifactCard
                  artifact={artifact}
                  onClick={() => openLightbox(artifact)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxArtifact(null)}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
      />
    </>
  );
}
