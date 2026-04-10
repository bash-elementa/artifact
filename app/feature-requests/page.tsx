"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NewFeatureRequestModal, type FeatureRequestData } from "@/components/feature-requests/NewFeatureRequestModal";

type Status = "NEW" | "TODO" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

function statusClass(status: Status): string {
  switch (status) {
    case "NEW":
      return "bg-blue-500/15 text-blue-400";
    case "TODO":
      return "bg-[var(--surface-2)] text-[var(--muted)]";
    case "IN_PROGRESS":
      return "bg-orange-500/15 text-orange-400";
    case "COMPLETED":
      return "bg-green-500/15 text-green-400";
    case "ARCHIVED":
      return "bg-[var(--surface-2)] text-[var(--muted)] opacity-50";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UserAvatar({ user }: { user: FeatureRequestData["user"] }) {
  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "?";

  return (
    <span className="flex items-center gap-1.5">
      <span
        className="rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--foreground)] overflow-hidden shrink-0"
        style={{ width: 20, height: 20, fontSize: 9, fontWeight: 600 }}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover rounded-full" />
        ) : (
          initials
        )}
      </span>
      <span>{user.name ?? user.email.split("@")[0]}</span>
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/feature-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FeatureRequestData[]) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id: string, status: Status) {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    try {
      await fetch(`/api/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Revert on failure — refetch
      fetch("/api/feature-requests")
        .then((res) => res.json())
        .then(setRequests)
        .catch(() => {});
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feature request?")) return;

    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch(`/api/feature-requests/${id}`, { method: "DELETE" });
    } catch {
      fetch("/api/feature-requests")
        .then((res) => res.json())
        .then(setRequests)
        .catch(() => {});
    }
  }

  function handleNewRequest(request: FeatureRequestData) {
    setRequests((prev) => [request, ...prev]);
  }

  return (
    <div className="pt-24 px-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Feature Requests</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Submitted by your team</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[var(--accent)] text-[var(--background)] rounded-xl px-4 py-2 text-sm font-semibold"
        >
          ＋ New request
        </button>
      </div>

      {/* Column header row */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_3fr_1.5fr_1fr_1.2fr_auto] gap-4 px-4 py-3 border-b border-[var(--border)] sticky top-16 bg-[var(--surface)] z-10">
          {["Title", "Description", "Submitted by", "Date", "Status", ""].map((h) => (
            <span key={h} className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">No feature requests yet</p>
            <p className="text-xs text-[var(--muted)] mt-1">Hit &apos;New request&apos; to submit the first one.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="grid grid-cols-[2fr_3fr_1.5fr_1fr_1.2fr_auto] gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors items-center"
            >
              <span className="text-sm font-semibold text-[var(--foreground)] truncate" title={req.title}>
                {req.title}
              </span>
              <span className="text-sm text-[var(--muted)] truncate" title={req.description}>
                {req.description}
              </span>
              <UserAvatar user={req.user} />
              <span className="text-xs text-[var(--muted)] whitespace-nowrap">{formatDate(req.createdAt)}</span>
              <select
                value={req.status}
                onChange={(e) => handleStatusChange(req.id, e.target.value as Status)}
                className={cn(
                  "appearance-none rounded-lg px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer w-fit",
                  statusClass(req.status as Status)
                )}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => handleDelete(req.id)}
                className="text-[var(--muted)] hover:text-red-400 transition-colors"
                aria-label="Delete request"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      <NewFeatureRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNewRequest}
      />
    </div>
  );
}
