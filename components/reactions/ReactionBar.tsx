"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🔥", "🤯"];

interface ReactionBarProps {
  artifactId: string;
  reactionCounts: Record<string, number>;
  myReactions: string[];
  onReact?: (emoji: string, action: "added" | "removed") => void;
  /** Force white text — use when rendered on a consistently dark surface (e.g. lightbox) */
  forceLight?: boolean;
}

export function ReactionBar({ artifactId, reactionCounts, myReactions, onReact, forceLight }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<string, number>>(reactionCounts);
  const [mine, setMine] = useState<Set<string>>(new Set(myReactions));
  const [loading, setLoading] = useState<string | null>(null);

  async function handleReact(emoji: string) {
    if (loading) return;
    setLoading(emoji);

    // Optimistic update
    const wasReacted = mine.has(emoji);
    const newMine = new Set(mine);
    const newCounts = { ...counts };

    if (wasReacted) {
      newMine.delete(emoji);
      newCounts[emoji] = Math.max(0, (newCounts[emoji] ?? 0) - 1);
      if (newCounts[emoji] === 0) delete newCounts[emoji];
    } else {
      newMine.add(emoji);
      newCounts[emoji] = (newCounts[emoji] ?? 0) + 1;
    }

    setMine(newMine);
    setCounts(newCounts);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId, emoji }),
      });

      if (!res.ok) {
        // Revert on error
        setMine(mine);
        setCounts(counts);
      } else {
        const data = await res.json();
        onReact?.(emoji, data.action);
      }
    } catch {
      setMine(mine);
      setCounts(counts);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = mine.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={loading === emoji}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-all duration-150",
              active
                ? "bg-white/20 scale-105"
                : "bg-white/5 hover:bg-white/10",
              forceLight
                ? active ? "text-white" : "text-white/60 hover:text-white"
                : active ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <span className="leading-none">{emoji}</span>
            {count > 0 && (
              <span className={cn(
                "text-xs font-medium",
                forceLight
                  ? active ? "text-white" : "text-white/60"
                  : active ? "text-[var(--foreground)]" : "text-[var(--muted)]"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
