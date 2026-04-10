"use client";

import { useEffect, useState, useMemo } from "react";
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

function statusClass(status: string): string {
  switch (status) {
    case "NEW":        return "bg-blue-500/15 text-blue-400";
    case "TODO":       return "bg-[var(--surface-2)] text-[var(--muted)]";
    case "IN_PROGRESS":return "bg-orange-500/15 text-orange-400";
    case "COMPLETED":  return "bg-green-500/15 text-green-400";
    case "ARCHIVED":   return "bg-[var(--surface-2)] text-[var(--muted)] opacity-50";
    default:           return "bg-[var(--surface-2)] text-[var(--muted)]";
  }
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ user }: { user: FeatureRequestData["user"] | null }) {
  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--muted)]">
        ?
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--foreground)] overflow-hidden shrink-0">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/feature-requests")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        setRequests(Array.isArray(data) ? (data as FeatureRequestData[]) : []);
      })
      .catch((err) => {
        console.error("Failed to load feature requests:", err);
        setFetchError(String(err?.message ?? err));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.user?.name ?? "").toLowerCase().includes(q) ||
        (r.user?.email ?? "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  async function handleStatusChange(id: string, status: Status) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await fetch(`/api/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      fetch("/api/feature-requests")
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setRequests(data))
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
        .then((data) => Array.isArray(data) && setRequests(data))
        .catch(() => {});
    }
  }

  function handleNewRequest(request: FeatureRequestData) {
    setRequests((prev) => [request, ...prev]);
  }

  return (
    <div className="pt-24 px-6 pb-8 w-full max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Feature Requests</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Submitted by your team</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[var(--accent)] text-[var(--background)] rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          ＋ New request
        </button>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load requests: {fetchError}
        </div>
      )}

      {/* Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">

        {/* Search bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[var(--muted)]"><SearchIcon /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-lg leading-none transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] w-[30%]">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] w-[30%]">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">Submitted by</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* Skeleton rows */
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-32 rounded bg-[var(--surface-2)] animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-48 rounded bg-[var(--surface-2)] animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] animate-pulse shrink-0" />
                      <div className="h-3.5 w-24 rounded bg-[var(--surface-2)] animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-6 w-20 rounded-lg bg-[var(--surface-2)] animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  {search ? (
                    <>
                      <p className="text-sm font-medium text-[var(--foreground)]">No results for &ldquo;{search}&rdquo;</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--foreground)]">No feature requests yet</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Hit &apos;New request&apos; to submit the first one.</p>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr
                  key={req.id}
                  className="group border-b border-[var(--border)] last:border-0 bg-transparent transition-colors"
                >
                  {/* Title */}
                  <td className="px-4 py-3.5 max-w-0">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate block" title={req.title}>
                      {req.title}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3.5 max-w-0">
                    <span className="text-sm text-[var(--muted)] truncate block" title={req.description}>
                      {req.description}
                    </span>
                  </td>

                  {/* Submitted by */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={req.user} />
                      <span className="text-sm text-[var(--foreground)]">
                        {req.user?.name ?? req.user?.email?.split("@")[0] ?? "Unknown"}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-sm text-[var(--muted)]">{formatDate(req.createdAt)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as Status)}
                      className={cn(
                        "appearance-none rounded-lg px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer w-fit",
                        statusClass(req.status)
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400 transition-all"
                      aria-label="Delete request"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted)]">
              {filtered.length} {filtered.length === 1 ? "request" : "requests"}
              {search && requests.length !== filtered.length && ` of ${requests.length}`}
            </span>
          </div>
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
