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

function statusClass(status: string): string {
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
    default:
      return "bg-[var(--surface-2)] text-[var(--muted)]";
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

function UserAvatar({ user }: { user: FeatureRequestData["user"] | null }) {
  if (!user) {
    return <span className="text-xs text-[var(--muted)]">Unknown</span>;
  }

  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?");

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
      <span className="text-sm text-[var(--foreground)]">{user.name ?? user.email?.split("@")[0] ?? "Unknown"}</span>
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
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/feature-requests")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setRequests(data as FeatureRequestData[]);
        } else {
          setRequests([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load feature requests:", err);
        setError(String(err?.message ?? err));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id: string, status: Status) {
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
    <div className="pt-24 px-6 pb-8 w-full">
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

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load feature requests: {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Title", "Description", "Submitted by", "Date", "Status", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : requests.length === 0 && !error ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-[var(--foreground)]">No feature requests yet</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Hit &apos;New request&apos; to submit the first one.</p>
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <td className="px-4 py-3 max-w-[160px]">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate block" title={req.title}>
                      {req.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <span className="text-sm text-[var(--muted)] truncate block" title={req.description}>
                      {req.description}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <UserAvatar user={req.user} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-[var(--muted)]">{formatDate(req.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as Status)}
                      className={cn(
                        "appearance-none rounded-lg px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer",
                        statusClass(req.status)
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="text-[var(--muted)] hover:text-red-400 transition-colors"
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
      </div>

      <NewFeatureRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNewRequest}
      />
    </div>
  );
}
