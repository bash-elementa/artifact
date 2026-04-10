"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { AnimatePresence } from "framer-motion";
import { ArtifactLightbox } from "@/components/explore/ArtifactLightbox";

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  role: string | null;
  team: string | null;
  bio: string | null;
}

interface FeedArtifact {
  id: string;
  name: string;
  type: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  figmaPreviewUrl?: string | null;
  screenshotUrl?: string | null;
  websiteUrl?: string | null;
  figmaUrl?: string | null;
  createdAt: string;
  reactionCounts: Record<string, number>;
  myReactions: string[];
  user: { id: string; name: string; role?: string | null; team?: string | null; image?: string | null };
}

function getPreviewUrl(a: FeedArtifact): string | null {
  return a.mediaUrl ?? a.figmaPreviewUrl ?? a.screenshotUrl ?? null;
}

function looksLikeVideo(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.includes("videodelivery.net") ||
    lower.includes("cloudflarestream.com") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxArtifact, setLightboxArtifact] = useState<FeedArtifact | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch(`/api/users/${userId}/artifacts`).then((r) => r.json()),
    ])
      .then(([user, arts]) => {
        setProfile(user.error ? null : user);
        setArtifacts(Array.isArray(arts) ? arts : []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

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

  function openLightbox(artifact: FeedArtifact) {
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

  const initials = profile?.name
    ? profile.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (loading) {
    return (
      <div className="w-full px-6 pt-24 pb-8">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] animate-pulse" />
          <div className="h-6 w-40 rounded-lg bg-[var(--surface-2)] animate-pulse" />
          <div className="h-4 w-24 rounded-lg bg-[var(--surface-2)] animate-pulse" />
        </div>
        <div className="columns-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-[var(--surface-2)] animate-pulse"
              style={{ height: [220, 300, 180, 260, 240, 200][i] }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[var(--muted)]">User not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-6 pt-24 pb-8">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <div
            className="rounded-full overflow-hidden bg-[var(--surface-2)] border-2 border-[var(--border)] flex items-center justify-center shrink-0"
            style={{ width: 80, height: 80 }}
          >
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt={profile.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[var(--foreground)]">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{profile.name ?? "Unknown"}</h1>
            {(profile.role || profile.team) && (
              <p className="text-sm text-[var(--muted)] mt-0.5">
                {[profile.role, profile.team].filter(Boolean).join(" · ")}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-[var(--muted)] mt-2 max-w-sm">{profile.bio}</p>
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {artifacts.length} {artifacts.length === 1 ? "artifact" : "artifacts"} shared
          </p>
        </div>

        {/* Artifacts grid */}
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="text-5xl">🌿</div>
            <p className="text-sm text-[var(--muted)]">No shared artifacts yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="gap-3" style={{ columnCount: 3, columnGap: 12 }}>
              {artifacts.map((artifact) => {
                const previewUrl = getPreviewUrl(artifact);
                const isVideo =
                  artifact.mediaMimeType?.startsWith("video/") ||
                  (!!artifact.mediaUrl && looksLikeVideo(artifact.mediaUrl));

                return (
                  <div
                    key={artifact.id}
                    className="break-inside-avoid mb-3 group cursor-pointer rounded-2xl overflow-hidden relative bg-[var(--surface-2)] min-h-[120px]"
                    onClick={() => openLightbox(artifact)}
                  >
                    {previewUrl ? (
                      isVideo ? (
                        <video
                          src={previewUrl}
                          autoPlay muted loop playsInline
                          className="w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={artifact.name}
                          className="w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                        />
                      )
                    ) : (
                      <div className="w-full aspect-[4/3] flex items-center justify-center">
                        <span className="text-4xl opacity-20">
                          {artifact.type === "URL" ? "🌐" : artifact.type === "FIGMA" ? "✦" : "🖼️"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-2xl" />
                  </div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      <ArtifactLightbox
        artifact={lightboxArtifact}
        onClose={() => setLightboxArtifact(null)}
        onReact={handleReact}
        onPrev={lightboxIndex > 0 ? () => navigateLightbox(-1) : undefined}
        onNext={lightboxIndex < artifacts.length - 1 ? () => navigateLightbox(1) : undefined}
      />
    </>
  );
}
