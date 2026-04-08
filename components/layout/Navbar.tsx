"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOCK_USER } from "@/lib/mock-user";
import { cn } from "@/lib/utils";
import { UploadModal } from "@/components/upload/UploadModal";

export function Navbar() {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);

  const tabs = [
    { href: "/explore", label: "Explore" },
    { href: "/projects", label: "Projects" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="flex h-14 items-center justify-between px-5">
          {/* Logo + Tabs inline */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/explore" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              /playground
            </Link>

            <nav className="flex items-center gap-0.5 rounded-full glass p-1">
              {tabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150",
                      active
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Upload + Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <span className="text-base leading-none">+</span>
              Upload
            </button>

            <Link href={`/profile/${MOCK_USER.id}`} className="group">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                {MOCK_USER.name.split(" ").map((n) => n[0]).join("")}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
