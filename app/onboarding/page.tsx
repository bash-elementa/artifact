"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, Check } from "@phosphor-icons/react";

const TEAMS = [
  "Product",
  "Data",
  "Engineering",
  "Experience Design",
  "Catalogue",
  "Omni Operations",
  "Brand Experience",
  "Operations",
  "Growth",
  "People Ops",
  "Digital Marketing",
  "Finance",
  "Retail",
  "Supply Chain",
  "Business Development",
  "Rewards",
  "Management",
];

function TeamPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = TEAMS.filter((t) =>
    t.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function select(team: string) {
    onChange(team);
    setOpen(false);
    setQuery("");
  }

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-left transition-colors focus:outline-none focus:border-[var(--muted)]"
        style={{ color: value ? "var(--foreground)" : "var(--muted)" }}
      >
        <span>{value || "Select your team"}</span>
        <CaretDown size={14} className="shrink-0 text-[var(--muted)]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-xl z-50 overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-[var(--border)]">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams…"
                className="w-full rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-52 p-1.5">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--muted)]">No teams found</p>
              ) : (
                filtered.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => select(team)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors rounded-xl"
                  >
                    <span>{team}</span>
                    {value === team && <Check size={14} className="text-[var(--accent)]" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OnboardingPage() {
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!team || !role.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, role: role.trim() }),
    });
    if (res.ok) {
      window.location.href = "/explore";
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-[var(--foreground)]">Welcome to /artifact</h1>
          <p className="text-sm text-[var(--muted)]">Tell us a bit about yourself to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Team</label>
            <TeamPicker value={team} onChange={setTeam} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Product Designer"
              className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--muted)]"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !team || !role.trim()}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-fg)] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Saving…" : "Get started"}
          </button>
        </form>
      </div>
    </div>
  );
}
