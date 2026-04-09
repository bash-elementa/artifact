"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UploadModal } from "@/components/upload/UploadModal";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const initials = user?.email
    ? user.email.split("@")[0].split(".").map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2)
    : "?";

  async function handleSignOut() {
    await fetch("/auth/sign-out", { method: "POST" });
    router.push("/auth/sign-in");
  }

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
              Artifact
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

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="group w-8 h-8 rounded-full glass flex items-center justify-center text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-40 glass rounded-xl shadow-lg overflow-hidden z-50">
                  {user?.id && (
                    <Link
                      href={`/profile/${user.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-white/10 transition-colors"
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
