"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DropdownCard, DropdownItem } from "@/components/ui/Dropdown";
import { UploadModal, type UploadType } from "@/components/upload/UploadModal";
import { NewFeatureRequestModal } from "@/components/feature-requests/NewFeatureRequestModal";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  User as PhUser,
  SignOut as PhSignOut,
  Lightbulb as PhLightbulb,
  Image as PhImage,
  Link as PhLink,
  FigmaLogo as PhFigma,
  Moon as PhMoon,
  Sun as PhSun,
  X as PhX,
  Compass as PhCompass,
  FolderSimple as PhFolderSimple,
  Plus as PhPlus,
} from "@phosphor-icons/react";

// ── Logo ────────────────────────────────────────────────────────────────────────

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

// ── Mobile bottom sheet wrapper ──────────────────────────────────────────────────

function MobileSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[61] md:hidden rounded-t-[2rem] overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderBottom: "none",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, { velocity, offset }) => {
              if (velocity.y > 300 || offset.y > 120) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────────

const UPLOAD_OPTIONS: { type: UploadType; label: string; icon: React.ReactNode }[] = [
  { type: "media", label: "Media",       icon: <PhImage size={16} /> },
  { type: "url",   label: "Website URL", icon: <PhLink size={16} /> },
  { type: "figma", label: "Figma",       icon: <PhFigma size={16} /> },
];

const MOBILE_UPLOAD_OPTIONS: { type: UploadType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: "media", label: "Media",       description: "Photos and videos", icon: <PhImage size={24} /> },
  { type: "url",   label: "Website URL", description: "Website or link",   icon: <PhLink size={24} /> },
  { type: "figma", label: "Figma",       description: "Design file",       icon: <PhFigma size={24} /> },
];

const NAV_TABS = [
  { href: "/explore",  label: "Explore",  Icon: PhCompass },
  { href: "/projects", label: "Projects", Icon: PhFolderSimple },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dbProfile, setDbProfile] = useState<{ role: string | null; team: string | null } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Nav pill — measured DOM positions, no layoutId
  const desktopNavRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const [desktopPill, setDesktopPill] = useState({ left: 0, width: 0, visible: false });
  const [mobilePill, setMobilePill] = useState({ left: 0, width: 0, visible: false });

  // Desktop upload dropdown
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  // Feature request
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureThanks, setFeatureThanks] = useState(false);

  // Desktop profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile sheets
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      const p = window.location.pathname;
      if (data.user && !p.startsWith("/onboarding") && !p.startsWith("/auth") && !p.startsWith("/hello")) {
        fetch("/api/auth/me")
          .then((r) => r.json())
          .then((profile) => {
            if (profile && !profile.team) {
              window.location.href = "/hello";
            } else if (profile) {
              setDbProfile({ role: profile.role ?? null, team: profile.team ?? null });
            }
          })
          .catch(() => {});
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") ?? "light") as "dark" | "light";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

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

  useEffect(() => {
    function measure(
      navRef: React.RefObject<HTMLElement | null>,
      setPill: React.Dispatch<React.SetStateAction<{ left: number; width: number; visible: boolean }>>
    ) {
      const navEl = navRef.current;
      if (!navEl || navEl.getBoundingClientRect().width === 0) return;
      const activeIndex = NAV_TABS.findIndex((tab) => pathname.startsWith(tab.href));
      if (activeIndex < 0) { setPill((p) => ({ ...p, visible: false })); return; }
      const tabs = navEl.querySelectorAll("a");
      const activeTab = tabs[activeIndex] as HTMLElement | undefined;
      if (!activeTab) return;
      const navRect = navEl.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setPill({ left: tabRect.left - navRect.left, width: tabRect.width, visible: true });
    }
    measure(desktopNavRef, setDesktopPill);
    measure(mobileNavRef, setMobilePill);
  }, [pathname]);

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
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // proceed with redirect regardless
    }
    window.location.replace("/auth/sign-in");
  }

  function handleFeatureRequestSuccess() {
    setFeatureThanks(true);
    setTimeout(() => setFeatureThanks(false), 2000);
  }

  const initials = user?.email
    ? user.email.split("@")[0].split(".").map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2)
    : "?";
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "You";

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding") || pathname.startsWith("/hello")) return null;

  const Avatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const cls = size === "lg"
      ? "w-14 h-14 rounded-2xl text-base"
      : "w-9 h-9 rounded-full text-xs";
    return (
      <div
        className={cn("flex items-center justify-center font-semibold text-[var(--muted)] overflow-hidden shrink-0", cls)}
        style={{ background: "var(--surface-2)" }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : initials}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop header ────────────────────────────────────────────────── */}
      <header
        className="hidden md:block fixed inset-x-0 top-0 z-40 pointer-events-none"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
      >
        <div className="flex h-16 items-center justify-between px-6 pointer-events-auto">

          {/* Left: Logo + Tabs */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/explore" className="text-[var(--foreground)] shrink-0">
              <ArtifactLogo />
            </Link>
            <nav
              ref={desktopNavRef as React.RefObject<HTMLElement>}
              className="relative flex items-center rounded-full p-1.5"
              style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
            >
              <motion.span
                className="absolute rounded-full shadow-sm pointer-events-none"
                style={{ background: "var(--foreground)", top: 6, bottom: 6 }}
                animate={{ left: desktopPill.left, width: desktopPill.width, opacity: desktopPill.visible ? 1 : 0 }}
                initial={{ left: desktopPill.left, width: desktopPill.width, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {NAV_TABS.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "relative z-10 px-7 py-2 text-sm font-semibold rounded-full",
                      active ? "text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Request feature + Upload + Theme + Avatar */}
          <div className="flex items-center gap-3 shrink-0">

            <button
              onClick={() => setFeatureModalOpen(true)}
              className="rounded-2xl border border-[var(--border)] text-[var(--foreground)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            >
              {featureThanks ? "Thanks!" : "Request a feature"}
            </button>

            <div className="relative" ref={uploadRef}>
              <button
                onClick={() => setUploadDropdownOpen((v) => !v)}
                className="rounded-2xl bg-[var(--foreground)] text-[var(--background)] px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              >
                Upload
              </button>
              <AnimatePresence>
                {uploadDropdownOpen && (
                  <DropdownCard className="right-0 w-44">
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

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--foreground)] opacity-60 hover:opacity-100 transition-opacity"
              style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <PhMoon size={18} /> : <PhSun size={18} />}
            </button>

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
                  <DropdownCard className="right-0 w-64">
                    {/* Profile header */}
                    <div className="px-4 pt-4 pb-3 flex flex-col items-center text-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div
                        className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-[var(--muted)] shrink-0"
                        style={{ width: 56, height: 56, background: "var(--surface-2)", border: "2px solid var(--border)" }}
                      >
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold">{initials}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">{displayName}</p>
                        {(dbProfile?.role || dbProfile?.team) && (
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {[dbProfile.role, dbProfile.team].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-1.5">
                      {user?.id && (
                        <DropdownItem
                          icon={<PhUser size={16} />}
                          label="View profile"
                          onClick={() => { setProfileOpen(false); router.push(`/users/${user.id}`); }}
                        />
                      )}
                      <DropdownItem
                        icon={<PhLightbulb size={16} />}
                        label="Feature Requests"
                        onClick={() => { setProfileOpen(false); router.push("/feature-requests"); }}
                      />
                      <DropdownItem
                        icon={<PhSignOut size={16} />}
                        label="Sign out"
                        onClick={handleSignOut}
                      />
                    </div>
                  </DropdownCard>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div
        className="flex md:hidden fixed inset-x-0 top-0 z-40 h-14 items-center justify-between px-5 pointer-events-none"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
      >
        <Link href="/explore" className="pointer-events-auto text-[var(--foreground)]">
          <ArtifactLogo />
        </Link>
        <button
          className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-[var(--muted)] overflow-hidden"
          style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
          onClick={() => setMobileProfileOpen(true)}
          aria-label="Open profile"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : initials}
        </button>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center px-5 gap-3 pointer-events-none"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          background: "transparent",
        }}
      >
        {/* Tab pill — fills available width */}
        <nav
          ref={mobileNavRef as React.RefObject<HTMLElement>}
          className="relative flex-1 flex items-center rounded-full p-1.5 pointer-events-auto h-14"
          style={{ background: "var(--nav-pill-bg)", boxShadow: "var(--nav-pill-shadow)" }}
        >
          <motion.span
            className="absolute rounded-full pointer-events-none"
            style={{ background: "var(--foreground)", top: 6, bottom: 6 }}
            animate={{ left: mobilePill.left, width: mobilePill.width, opacity: mobilePill.visible ? 1 : 0 }}
            initial={{ left: mobilePill.left, width: mobilePill.width, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
          {NAV_TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const { Icon } = tab;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-full",
                  active ? "text-[var(--background)]" : "text-[var(--muted)]"
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} />
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Upload circle — same height as pill */}
        <button
          className="pointer-events-auto w-14 h-14 shrink-0 rounded-full flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
          style={{ boxShadow: "var(--nav-pill-shadow)" }}
          onClick={() => setMobileUploadOpen(true)}
          aria-label="Upload artifact"
        >
          <PhPlus size={22} weight="bold" />
        </button>
      </div>

      {/* ── Mobile profile sheet ──────────────────────────────────────────── */}
      <MobileSheet open={mobileProfileOpen} onClose={() => setMobileProfileOpen(false)}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => setMobileProfileOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            style={{ background: "var(--surface-2)" }}
          >
            <PhX size={15} />
          </button>
          <span className="text-sm font-semibold">You</span>
          <div className="w-8" />
        </div>

        {/* User info */}
        <div className="px-5 pt-2 pb-5 flex flex-col items-center text-center gap-2.5">
          <div
            className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-[var(--muted)] shrink-0"
            style={{ width: 72, height: 72, background: "var(--surface-2)", border: "2px solid var(--border)" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[var(--foreground)]">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
            {(dbProfile?.role || dbProfile?.team) && (
              <p className="text-sm text-[var(--muted)] mt-0.5">
                {[dbProfile.role, dbProfile.team].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Theme row */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors rounded-xl text-left"
          >
            <span className="text-[var(--muted)]">
              {theme === "dark" ? <PhMoon size={18} /> : <PhSun size={18} />}
            </span>
            {theme === "dark" ? "Dark mode" : "Light mode"}
            {/* Toggle pill */}
            <div className="ml-auto relative w-10 h-6 rounded-full transition-colors" style={{ background: theme === "dark" ? "var(--foreground)" : "var(--border)" }}>
              <div
                className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                style={{
                  background: "var(--background)",
                  transform: theme === "dark" ? "translateX(1.25rem)" : "translateX(0.25rem)",
                }}
              />
            </div>
          </button>
        </div>

        <div className="mx-5 h-px my-2" style={{ background: "var(--border)" }} />

        {/* Menu items */}
        <div className="px-3 pb-2">
          {user?.id && (
            <button
              onClick={() => { setMobileProfileOpen(false); router.push(`/users/${user.id}`); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors rounded-xl text-left"
            >
              <span className="text-[var(--muted)]"><PhUser size={18} /></span>
              View Profile
            </button>
          )}
          <button
            onClick={() => { setMobileProfileOpen(false); setFeatureModalOpen(true); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors rounded-xl text-left"
          >
            <span className="text-[var(--muted)]"><PhLightbulb size={18} /></span>
            Feature Requests
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors rounded-xl text-left"
          >
            <span className="text-[var(--muted)]"><PhSignOut size={18} /></span>
            Sign out
          </button>
        </div>
      </MobileSheet>

      {/* ── Mobile upload sheet ───────────────────────────────────────────── */}
      <MobileSheet open={mobileUploadOpen} onClose={() => setMobileUploadOpen(false)}>
        <div className="px-5 pt-3 pb-2">
          <h3 className="text-base font-semibold mb-4">Upload artifact</h3>
          <div className="flex flex-col gap-2">
            {MOBILE_UPLOAD_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => { setMobileUploadOpen(false); setUploadType(opt.type); }}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-colors hover:opacity-90"
                style={{ background: "var(--surface-2)" }}
              >
                <span className="text-[var(--muted)]">{opt.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{opt.label}</p>
                  <p className="text-xs text-[var(--muted)]">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </MobileSheet>

      {/* Upload modal */}
      {uploadType && (
        <UploadModal
          open={true}
          type={uploadType}
          onClose={closeUploadModal}
          requireProject={true}
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
