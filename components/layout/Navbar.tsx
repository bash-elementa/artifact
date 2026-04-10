"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UploadModal, type UploadType } from "@/components/upload/UploadModal";
import { NewFeatureRequestModal } from "@/components/feature-requests/NewFeatureRequestModal";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── Icons ──────────────────────────────────────────────────────────────────────

function ArtifactLogo() {
  return (
    <svg width="100" height="16" viewBox="0 0 134 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="/artifact">
      <path d="M3.98438 20.7363H0L6.71973 1.44043H10.7041L3.98438 20.7363Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M17.1133 5.92773C18.4252 5.92773 19.5858 6.22347 20.5938 6.81543C21.4639 7.3185 22.1993 8.00806 22.8037 8.88086L23.1377 6.33594H28.8496L27.9375 13.2002L28.8496 20.0879H23.1377L22.7969 17.5205C22.2021 18.3911 21.4691 19.0876 20.5938 19.6074C19.5858 20.1994 18.4253 20.4961 17.1133 20.4961C15.7856 20.496 14.6098 20.1918 13.5859 19.584C12.562 18.976 11.7615 18.128 11.1855 17.04C10.6255 15.936 10.3457 14.6636 10.3457 13.2236C10.3457 11.7517 10.6256 10.4717 11.1855 9.38379C11.7615 8.27979 12.5619 7.43184 13.5859 6.83984C14.6098 6.23196 15.7855 5.9278 17.1133 5.92773ZM18.8418 10.0801C18.2659 10.0801 17.7536 10.2154 17.3057 10.4873C16.8577 10.7593 16.506 11.1362 16.25 11.6162C16.0101 12.0801 15.8897 12.6158 15.8896 13.2236C15.8896 13.8316 16.01 14.368 16.25 14.832C16.506 15.2958 16.8578 15.6636 17.3057 15.9355C17.7537 16.2075 18.2658 16.3438 18.8418 16.3438C19.4338 16.3437 20.0019 16.2075 20.5459 15.9355C21.0897 15.6636 21.5695 15.2958 21.9854 14.832C22.4014 14.368 22.7055 13.8316 22.8975 13.2236C22.7055 12.6157 22.4013 12.0801 21.9854 11.6162C21.5694 11.1362 21.0899 10.7593 20.5459 10.4873C20.0019 10.2153 19.4338 10.0801 18.8418 10.0801Z" fill="currentColor"/>
      <path d="M51.916 6.33594H57.4844V10.3682H51.916V13.7998C51.916 14.7278 52.0923 15.3836 52.4443 15.7676C52.8123 16.1516 53.5241 16.3437 54.5801 16.3438C55.236 16.3438 55.8201 16.2962 56.332 16.2002C56.844 16.0882 57.3086 15.952 57.7246 15.792V19.8477C57.2127 20.0076 56.5642 20.1513 55.7803 20.2793C54.9964 20.4233 54.1724 20.4961 53.3086 20.4961C51.7406 20.4961 50.4439 20.2554 49.4199 19.7754C48.4122 19.2955 47.6526 18.6077 47.1406 17.7119C46.6447 16.816 46.3965 15.7599 46.3965 14.5439V10.3682H43.6602V7.99219L46.3965 6.74414L48.7959 2.61621H51.916V6.33594Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M88.1289 5.92773C89.4409 5.92773 90.6014 6.22347 91.6094 6.81543C92.4796 7.3185 93.2149 8.00806 93.8193 8.88086L94.1533 6.33594H99.8652L98.9531 13.2002L99.8652 20.0879H94.1533L93.8125 17.5205C93.2178 18.3911 92.4848 19.0876 91.6094 19.6074C90.6014 20.1994 89.4409 20.4961 88.1289 20.4961C86.8012 20.496 85.6254 20.1918 84.6016 19.584C83.5776 18.976 82.7772 18.128 82.2012 17.04C81.6412 15.936 81.3613 14.6636 81.3613 13.2236C81.3613 11.7517 81.6412 10.4717 82.2012 9.38379C82.7772 8.27979 83.5776 7.43184 84.6016 6.83984C85.6254 6.23196 86.8011 5.9278 88.1289 5.92773ZM89.8574 10.0801C89.2815 10.0801 88.7692 10.2154 88.3213 10.4873C87.8733 10.7593 87.5216 11.1362 87.2656 11.6162C87.0257 12.0801 86.9053 12.6158 86.9053 13.2236C86.9053 13.8316 87.0256 14.368 87.2656 14.832C87.5216 15.2958 87.8735 15.6636 88.3213 15.9355C88.7693 16.2075 89.2814 16.3438 89.8574 16.3438C90.4494 16.3437 91.0176 16.2075 91.5615 15.9355C92.1053 15.6636 92.5851 15.2958 93.001 14.832C93.417 14.368 93.7211 13.8316 93.9131 13.2236C93.7211 12.6157 93.4169 12.0801 93.001 11.6162C92.585 11.1362 92.1055 10.7593 91.5615 10.4873C91.0176 10.2153 90.4494 10.0801 89.8574 10.0801Z" fill="currentColor"/>
      <path d="M109.994 5.92773C111.562 5.92777 112.97 6.19177 114.218 6.71973C115.482 7.24773 116.506 7.98373 117.29 8.92773C118.074 9.8717 118.53 10.9837 118.658 12.2637H113.21C113.05 11.5117 112.681 10.9436 112.105 10.5596C111.53 10.1598 110.826 9.96001 109.994 9.95996C109.354 9.95996 108.793 10.0877 108.313 10.3438C107.834 10.5837 107.466 10.9516 107.21 11.4473C106.954 11.9272 106.826 12.5197 106.826 13.2236C106.826 13.9276 106.954 14.52 107.21 15C107.466 15.4798 107.834 15.8476 108.313 16.1035C108.793 16.3435 109.354 16.4639 109.994 16.4639C110.826 16.4638 111.53 16.2557 112.105 15.8398C112.681 15.4079 113.05 14.848 113.21 14.1602H118.658C118.53 15.424 118.074 16.5362 117.29 17.4961C116.506 18.44 115.482 19.1761 114.218 19.7041C112.97 20.232 111.562 20.4961 109.994 20.4961C108.282 20.4961 106.762 20.192 105.434 19.584C104.122 18.976 103.097 18.1196 102.361 17.0156C101.625 15.9117 101.258 14.6475 101.258 13.2236C101.258 11.7679 101.626 10.4961 102.361 9.4082C103.097 8.3202 104.122 7.47128 105.434 6.86328C106.762 6.23928 108.282 5.92773 109.994 5.92773Z" fill="currentColor"/>
      <path d="M127.408 6.33594H132.977V10.3682H127.408V13.7998C127.408 14.7278 127.585 15.3836 127.937 15.7676C128.305 16.1516 129.016 16.3437 130.072 16.3438C130.728 16.3438 131.312 16.2962 131.824 16.2002C132.336 16.0882 132.801 15.952 133.217 15.792V19.8477C132.705 20.0076 132.056 20.1513 131.272 20.2793C130.489 20.4233 129.665 20.4961 128.801 20.4961C127.233 20.4961 125.936 20.2554 124.912 19.7754C123.904 19.2955 123.145 18.6077 122.633 17.7119C122.137 16.816 121.889 15.7599 121.889 14.5439V10.3682H119.152V7.99219L121.889 6.74414L124.288 2.61621H127.408V6.33594Z" fill="currentColor"/>
      <path d="M41.3975 5.92773C41.6535 5.92774 41.9175 5.94359 42.1895 5.97559C42.4614 5.99159 42.7497 6.02329 43.0537 6.07129V10.752C42.5418 10.656 42.0696 10.5916 41.6377 10.5596C41.2217 10.5116 40.8374 10.4873 40.4854 10.4873C39.8294 10.4873 39.2211 10.6161 38.6611 10.8721C38.1013 11.1121 37.6449 11.5357 37.293 12.1436C36.957 12.7356 36.7891 13.5602 36.7891 14.6162V20.0879H31.293V11.04L30.3574 6.33594H35.9736L36.5693 9.89746C36.7937 9.26831 37.0673 8.69694 37.3896 8.18359C37.8216 7.47972 38.3572 6.9273 38.9971 6.52734C39.6531 6.12734 40.4535 5.92773 41.3975 5.92773Z" fill="currentColor"/>
      <path d="M65.1201 20.0879H59.624V6.07227L62.3838 6.64844L65.1201 6.07227V20.0879Z" fill="currentColor"/>
      <path d="M77.2158 1.2002C77.9035 1.20022 78.5271 1.24782 79.0869 1.34375C79.6629 1.42375 80.2795 1.55154 80.9355 1.72754V5.71191C80.4395 5.56791 79.9433 5.45598 79.4473 5.37598C78.9513 5.29598 78.4233 5.25586 77.8633 5.25586C76.8233 5.25587 76.119 5.43219 75.751 5.78418C75.3833 6.1202 75.1992 6.64845 75.1992 7.36816V7.53613H80.5752V11.5674H75.1992V20.0879H69.7031V11.5674H66.9434V7.53613H69.7051C69.7148 6.17563 70.0013 5.03129 70.5674 4.10352C71.1434 3.14359 71.9914 2.42333 73.1113 1.94336C74.2313 1.44739 75.5999 1.2002 77.2158 1.2002Z" fill="currentColor"/>
      <path d="M62.3838 0C63.3437 1.90517e-05 64.1041 0.232308 64.6641 0.696289C65.2398 1.16022 65.5273 1.79207 65.5273 2.5918C65.5273 3.37566 65.2399 3.99989 64.6641 4.46387C64.1041 4.92785 63.3437 5.16014 62.3838 5.16016C61.4558 5.16016 60.7039 4.92782 60.1279 4.46387C59.5519 3.99987 59.2637 3.3758 59.2637 2.5918C59.2637 1.79189 59.552 1.16025 60.1279 0.696289C60.7039 0.232298 61.4558 0 62.3838 0Z" fill="currentColor"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

// Inline SVG icons for dropdowns
function IconMedia() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
function IconUrl() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function IconFigma() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z"/>
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6"/>
      <path d="M12 3a6 6 0 0 1 6 6c0 2.4-1.4 4.5-3.5 5.6L14 17H10l-.5-2.4C7.4 13.5 6 11.4 6 9a6 6 0 0 1 6-6z"/>
    </svg>
  );
}

// ── Dropdown card shell ────────────────────────────────────────────────────────

function DropdownCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute right-0 top-full mt-2 rounded-2xl shadow-xl overflow-hidden z-50 ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 180 }}
    >
      {children}
    </motion.div>
  );
}

function DropdownItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left rounded-xl",
        danger
          ? "text-red-500 hover:bg-[var(--surface-2)]"
          : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
      )}
    >
      <span className="text-[var(--muted)]">{icon}</span>
      {label}
    </button>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

const UPLOAD_OPTIONS: { type: UploadType; label: string; icon: React.ReactNode }[] = [
  { type: "media", label: "Media", icon: <IconMedia /> },
  { type: "url",   label: "URL",   icon: <IconUrl /> },
  { type: "figma", label: "Figma", icon: <IconFigma /> },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Upload dropdown
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  // Feature request button
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureThanks, setFeatureThanks] = useState(false);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") ?? "dark") as "dark" | "light";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  // Close upload dropdown on outside click
  useEffect(() => {
    if (!uploadDropdownOpen) return;
    function onDown(e: MouseEvent) {
      if (uploadRef.current && !uploadRef.current.contains(e.target as Node)) {
        setUploadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [uploadDropdownOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  function openProfile() {
    if (profileCloseTimer.current) clearTimeout(profileCloseTimer.current);
    setProfileOpen(true);
  }
  function closeProfile() {
    profileCloseTimer.current = setTimeout(() => setProfileOpen(false), 150);
  }

  function pickUploadType(type: UploadType) {
    setUploadDropdownOpen(false);
    setUploadType(type);
  }

  function closeUploadModal() {
    setUploadType(null);
  }

  async function handleSignOut() {
    await fetch("/auth/sign-out", { method: "POST" });
    router.push("/auth/sign-in");
  }

  function handleFeatureRequestSuccess() {
    setFeatureThanks(true);
    setTimeout(() => setFeatureThanks(false), 2000);
  }

  const initials = user?.email
    ? user.email.split("@")[0].split(".").map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2)
    : "?";
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  const tabs = [
    { href: "/explore", label: "Explore" },
    { href: "/projects", label: "Projects" },
  ];

  if (pathname.startsWith("/auth")) return null;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 pointer-events-none"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
      >
        <div className="flex h-16 items-center justify-between px-6 pointer-events-auto">

          {/* Left: Logo + Tabs */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/explore" className="text-[var(--foreground)] shrink-0">
              <ArtifactLogo />
            </Link>
            <nav
              className="flex items-center rounded-full p-1.5"
              style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
            >
              {tabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "px-7 py-2 text-sm font-semibold rounded-full transition-all duration-200",
                      active
                        ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Upload dropdown + Theme + Avatar */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Request a feature */}
            <button
              onClick={() => setFeatureModalOpen(true)}
              className="rounded-2xl border border-[var(--border)] text-[var(--foreground)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            >
              {featureThanks ? "Thanks!" : "Request a feature"}
            </button>

            {/* Upload — click opens dropdown */}
            <div className="relative" ref={uploadRef}>
              <button
                onClick={() => setUploadDropdownOpen((v) => !v)}
                className="rounded-2xl bg-[var(--foreground)] text-[var(--background)] px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              >
                Upload
              </button>
              <AnimatePresence>
                {uploadDropdownOpen && (
                  <DropdownCard className="w-44">
                    <div className="p-1.5">
                      {UPLOAD_OPTIONS.map((opt) => (
                        <DropdownItem
                          key={opt.type}
                          icon={opt.icon}
                          label={opt.label}
                          onClick={() => pickUploadType(opt.type)}
                        />
                      ))}
                    </div>
                  </DropdownCard>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--foreground)] opacity-60 hover:opacity-100 transition-opacity"
              style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Avatar + profile dropdown */}
            <div className="relative" onMouseEnter={openProfile} onMouseLeave={closeProfile}>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors overflow-hidden"
                style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : initials}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <DropdownCard className="w-52">
                    <div className="p-1.5">
                      {user?.id && (
                        <DropdownItem
                          icon={<IconProfile />}
                          label="Profile"
                          onClick={() => { setProfileOpen(false); router.push(`/profile/${user.id}`); }}
                        />
                      )}
                    </div>
                    <div className="border-t border-[var(--border)] p-1.5">
                      <DropdownItem
                        icon={<IconLightbulb />}
                        label="Feature Requests"
                        onClick={() => { setProfileOpen(false); router.push("/feature-requests"); }}
                      />
                      <DropdownItem
                        icon={<IconSignOut />}
                        label="Sign out"
                        onClick={handleSignOut}
                        danger
                      />
                    </div>
                  </DropdownCard>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Upload modal — opens to specific type */}
      {uploadType && (
        <UploadModal
          open={true}
          type={uploadType}
          onClose={closeUploadModal}
        />
      )}

      {/* Feature request modal */}
      <NewFeatureRequestModal
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        onSuccess={handleFeatureRequestSuccess}
      />
    </>
  );
}
