"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, SquaresFour, FolderOpen, ShareNetwork } from "@phosphor-icons/react";

// ── Step visuals ─────────────────────────────────────────────────────────────

function ExploreVisual() {
  const tiles = [
    { w: 140, h: 100, bg: "#e8e4f0", delay: 0 },
    { w: 100, h: 130, bg: "#fce8dc", delay: 0.05 },
    { w: 120, h: 90,  bg: "#dcedf5", delay: 0.1 },
    { w: 110, h: 115, bg: "#e8f0e4", delay: 0.15 },
    { w: 130, h: 85,  bg: "#f5e8dc", delay: 0.2 },
    { w: 95,  h: 125, bg: "#e4e8f5", delay: 0.25 },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center gap-2.5 overflow-hidden px-4">
      {[0, 1].map((col) => (
        <div key={col} className="flex flex-col gap-2.5">
          {tiles.slice(col * 3, col * 3 + 3).map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: t.delay, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl relative overflow-hidden shrink-0"
              style={{ width: t.w, height: t.h, background: t.bg }}
            >
              {/* Fake avatar pill */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1"
                style={{ background: "rgba(0,0,0,0.12)" }}>
                <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
                <div className="w-10 h-1.5 rounded-full bg-white/50" />
              </div>
            </motion.div>
          ))}
        </div>
      ))}
      {/* Third column, offset */}
      <div className="flex flex-col gap-2.5 -mt-8">
        {tiles.slice(0, 2).map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl relative overflow-hidden shrink-0"
            style={{ width: 105, height: i === 0 ? 120 : 95, background: i === 0 ? "#f0e8f5" : "#f5f0e4" }}
          >
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1"
              style={{ background: "rgba(0,0,0,0.12)" }}>
              <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
              <div className="w-8 h-1.5 rounded-full bg-white/50" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ViewsVisual() {
  const [active, setActive] = useState<"canvas" | "grid">("canvas");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Toggle pill */}
      <motion.div
        className="flex items-center gap-1 rounded-2xl px-2 py-1.5 shadow-lg"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {(["canvas", "grid"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setActive(mode)}
            className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10 transition-colors"
            style={{ color: active === mode ? "var(--background)" : "var(--muted)" }}
          >
            {active === mode && (
              <motion.span
                layoutId="preview-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: "var(--foreground)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">
              {mode === "canvas"
                ? <Compass size={18} weight={active === "canvas" ? "fill" : "regular"} />
                : <SquaresFour size={18} weight={active === "grid" ? "fill" : "regular"} />
              }
            </span>
          </button>
        ))}
      </motion.div>

      {/* Layout preview */}
      <AnimatePresence mode="wait">
        {active === "canvas" ? (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-72 h-40 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)" }}
          >
            {/* Scattered tiles */}
            {[
              { x: 12,  y: 10,  w: 100, h: 70,  bg: "#e8e4f0", r: -3 },
              { x: 120, y: 5,   w: 80,  h: 55,  bg: "#fce8dc", r: 2 },
              { x: 60,  y: 75,  w: 90,  h: 55,  bg: "#dcedf5", r: -1.5 },
              { x: 168, y: 68,  w: 85,  h: 60,  bg: "#e8f0e4", r: 1 },
            ].map((t, i) => (
              <div
                key={i}
                className="absolute rounded-xl"
                style={{ left: t.x, top: t.y, width: t.w, height: t.h, background: t.bg, transform: `rotate(${t.r}deg)` }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 h-40 rounded-2xl p-3 grid grid-cols-3 gap-2"
            style={{ background: "var(--surface)" }}
          >
            {["#e8e4f0","#fce8dc","#dcedf5","#e8f0e4","#f5e8dc","#e4e8f5"].map((bg, i) => (
              <div key={i} className="rounded-xl" style={{ background: bg }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {active === "canvas" ? "Infinite canvas" : "Grid view"} — tap to switch
      </p>
    </div>
  );
}

function ProjectsVisual() {
  const projects = [
    { name: "Daily Planner", count: 4, color: "#7474ee22", accent: "#7474ee" },
    { name: "Bottom Sheet", count: 7, color: "#f9731622", accent: "#f97316" },
    { name: "Checkout Flow", count: 2, color: "#22c55e22", accent: "#22c55e" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6">
      <div className="w-full max-w-xs flex flex-col gap-2">
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: p.color }}>
              <FolderOpen size={16} weight="fill" style={{ color: p.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{p.count} artifacts</p>
            </div>
            {/* Tiny avatar stack */}
            <div className="flex -space-x-1.5">
              {[...Array(Math.min(p.count, 3))].map((_, j) => (
                <div key={j} className="w-5 h-5 rounded-full border-2 shrink-0"
                  style={{ background: "var(--border)", borderColor: "var(--surface-2)" }} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* New project button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border-2 border-dashed"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--surface)" }}>
            <span className="text-lg leading-none" style={{ color: "var(--muted)" }}>+</span>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>New project</p>
        </motion.div>
      </div>
    </div>
  );
}

function ShareVisual() {
  const [shared, setShared] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center px-6">
      <div className="w-full max-w-xs flex flex-col gap-3">
        {/* Artifact card */}
        <motion.div
          className="rounded-2xl overflow-hidden relative"
          style={{ background: "#e8e4f0" }}
        >
          {/* Fake image */}
          <div className="h-40 w-full" style={{ background: "linear-gradient(135deg, #d4cfe8 0%, #e8e4f0 100%)" }}>
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <div className="w-16 h-16 rounded-2xl" style={{ background: "#7474ee" }} />
            </div>
          </div>

          {/* Share button — top right, glowing when active */}
          <motion.button
            onClick={() => setShared((v) => !v)}
            className="absolute top-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            animate={shared
              ? { background: "#7474ee", color: "#ffffff", boxShadow: "0 0 0 4px #7474ee30" }
              : { background: "rgba(0,0,0,0.5)", color: "#ffffff", boxShadow: "0 0 0 0px #7474ee00" }
            }
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ShareNetwork size={12} weight={shared ? "fill" : "regular"} />
            {shared ? "Shared" : "Share"}
          </motion.button>
        </motion.div>

        {/* Hint text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={shared ? "shared" : "idle"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-center font-medium"
            style={{ color: "var(--muted)" }}
          >
            {shared
              ? "Now visible to the whole team on Explore ✓"
              : "Tap share to send it to the feed"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    label: "Explore",
    title: "Your team's shared canvas",
    description: "Explore is a live feed of artifacts shared by your teammates — work in progress, inspiration, designs, and websites all in one place.",
    visual: <ExploreVisual />,
  },
  {
    label: "Two views",
    title: "Browse your way",
    description: "Switch between an infinite canvas for a spatial overview, or a clean grid when you want to focus.",
    visual: <ViewsVisual />,
  },
  {
    label: "Projects",
    title: "Organised by project",
    description: "Group artifacts into projects, invite teammates to contribute, and keep all your references in one place.",
    visual: <ProjectsVisual />,
  },
  {
    label: "Share",
    title: "Share what you're proud of",
    description: "When an artifact is worth the team's attention, share it to Explore. One tap — and everyone sees it.",
    visual: <ShareVisual />,
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TourPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [exiting, setExiting] = useState(false);

  const isLast = step === STEPS.length - 1;

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function handleNext() {
    if (isLast) {
      setExiting(true);
      setTimeout(() => { window.location.href = "/explore"; }, 600);
    } else {
      go(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) go(step - 1);
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <>
      <div
        className="relative w-screen h-screen overflow-hidden select-none bg-[var(--background)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(4,4,4,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full"
            style={{
              width: 900, height: 700, top: "5%", left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(116,116,238,0.07) 0%, transparent 65%)",
            }}
          />
        </div>

        {/* Step dots — top center */}
        <div className="absolute top-8 inset-x-0 flex items-center justify-center gap-2 z-10">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                background: i === step ? "var(--foreground)" : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* Skip — top right */}
        {!isLast && (
          <button
            onClick={() => { setExiting(true); setTimeout(() => { window.location.href = "/explore"; }, 600); }}
            className="absolute top-7 right-7 text-sm font-medium z-10 transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
          >
            Skip
          </button>
        )}

        {/* Step content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-28 pt-20 px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md flex flex-col items-center gap-6 h-full"
            >
              {/* Visual area */}
              <div
                className="w-full rounded-3xl overflow-hidden shrink-0"
                style={{
                  height: 300,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {STEPS[step].visual}
              </div>

              {/* Text */}
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  {STEPS[step].label}
                </p>
                <h1 className="text-2xl font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {STEPS[step].title}
                </h1>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--muted)" }}>
                  {STEPS[step].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Control bar — bottom center, same glass pill as /hello */}
        <div className="absolute bottom-7 inset-x-0 flex justify-center px-6 z-10">
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-2.5">
            {step > 0 && (
              <>
                <BackButton onClick={handleBack} />
                <div className="w-px h-4 mx-0.5 bg-[var(--border)]" />
              </>
            )}
            <span className="text-sm font-medium px-2" style={{ color: "var(--muted)", minWidth: 120, textAlign: "center" }}>
              {isLast ? "You're all set" : `${step + 1} of ${STEPS.length}`}
            </span>
            <div className="w-px h-4 mx-0.5 bg-[var(--border)]" />
            <NextButton isLast={isLast} onClick={handleNext} />
          </div>
        </div>

        {/* Exit fade */}
        <AnimatePresence>
          {exiting && (
            <motion.div
              key="exit-fade"
              className="absolute inset-0 z-50"
              style={{ background: "var(--background)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Control buttons ───────────────────────────────────────────────────────────

function NextButton({ isLast, onClick }: { isLast: boolean; onClick: () => void }) {
  return isLast ? (
    <button
      onClick={onClick}
      className="h-9 px-4 flex items-center justify-center rounded-full shrink-0 text-sm font-semibold transition-opacity hover:opacity-85"
      style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
    >
      Get started
    </button>
  ) : (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-opacity hover:opacity-85"
      style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
    >
      <ArrowRight size={18} weight="bold" />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all"
      style={{ color: "var(--muted)", background: "transparent" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--surface)";
        (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "var(--muted)";
      }}
    >
      <ArrowRight size={18} weight="bold" className="rotate-180" />
    </button>
  );
}
