"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, SquaresFour, FolderOpen, ShareNetwork, X, Image, FilmStrip, Globe, PenNib, LinkSimple, Code } from "@phosphor-icons/react";

// ── Step visuals ─────────────────────────────────────────────────────────────

function ExploreVisual() {
  const tiles = [
    { bg: "#e8e4f0", icon: <Image size={18} weight="fill" color="#7474ee" />,      delay: 0 },
    { bg: "#fce8dc", icon: <FilmStrip size={18} weight="fill" color="#f97316" />,  delay: 0.05 },
    { bg: "#dcedf5", icon: <Globe size={18} weight="fill" color="#3b9ec7" />,      delay: 0.1 },
    { bg: "#f0e8ff", icon: <Code size={18} weight="bold" color="#8b5cf6" />,       delay: 0.15 },
    { bg: "#e8f0e4", icon: <PenNib size={18} weight="fill" color="#4caf7d" />,     delay: 0.2 },
    { bg: "#fdeaea", icon: <LinkSimple size={18} weight="bold" color="#e05c5c" />, delay: 0.25 },
  ];

  return (
    <div className="w-full h-full grid grid-cols-3 gap-2.5 p-4">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: t.delay, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl flex items-center justify-center relative"
          style={{ background: t.bg }}
        >
          {t.icon}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-1.5 py-0.5"
            style={{ background: "rgba(0,0,0,0.12)" }}>
            <div className="w-3 h-3 rounded-full bg-white/60" />
            <div className="w-8 h-1.5 rounded-full bg-white/50" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ViewsVisual() {
  const [active, setActive] = useState<"canvas" | "grid">("canvas");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      {/* Toggle */}
      <div
        className="flex items-center gap-1 rounded-xl px-1.5 py-1.5 shadow-sm"
        style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {(["canvas", "grid"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setActive(mode)}
            className="w-9 h-9 rounded-lg flex items-center justify-center relative z-10"
            style={{ color: active === mode ? "#ffffff" : "rgba(0,0,0,0.35)" }}
          >
            {active === mode && (
              <motion.span
                layoutId="preview-pill"
                className="absolute inset-0 rounded-lg"
                style={{ background: "var(--foreground)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">
              {mode === "canvas"
                ? <Compass size={16} weight={active === "canvas" ? "fill" : "regular"} />
                : <SquaresFour size={16} weight={active === "grid" ? "fill" : "regular"} />}
            </span>
          </button>
        ))}
      </div>

      {/* Layout preview */}
      <AnimatePresence mode="wait">
        {active === "canvas" ? (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-64 h-36 rounded-xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* Masonry — tiles overflow all 4 edges to show canvas extends beyond */}
            <div className="flex gap-2" style={{ margin: -10, height: "calc(100% + 20px)" }}>
              {[
                [{ h: 72, bg: "#e8e4f0" }, { h: 60, bg: "#fce8dc" }, { h: 68, bg: "#e4e8f5" }],
                [{ h: 64, bg: "#dcedf5" }, { h: 76, bg: "#e8f0e4" }, { h: 60, bg: "#f0e4f5" }],
                [{ h: 70, bg: "#f5e8dc" }, { h: 62, bg: "#e8e4f0" }, { h: 72, bg: "#dcedf5" }],
              ].map((col, ci) => (
                <div key={ci} className="flex flex-col gap-2 flex-1" style={{ marginTop: ci === 1 ? 14 : 0 }}>
                  {col.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: (ci * 3 + i) * 0.04 }}
                      className="rounded-xl shrink-0 w-full"
                      style={{ height: t.h, background: t.bg }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-64 h-36 rounded-xl p-2.5 grid grid-cols-3 gap-2"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {["#e8e4f0","#fce8dc","#dcedf5","#e8f0e4","#f5e8dc","#e4e8f5"].map((bg, i) => (
              <div key={i} className="rounded-lg" style={{ background: bg }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs font-medium" style={{ color: "rgba(0,0,0,0.35)" }}>
        Tap to switch views
      </p>
    </div>
  );
}

function ProjectsVisual() {
  const projects = [
    { name: "Daily Planner",  count: 4, color: "#7474ee22", accent: "#7474ee" },
    { name: "Bottom Sheet",   count: 7, color: "#f9731622", accent: "#f97316" },
    { name: "Checkout Flow",  count: 2, color: "#22c55e22", accent: "#22c55e" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-5">
      {projects.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: p.color }}>
            <FolderOpen size={14} weight="fill" style={{ color: p.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.count} artifacts</p>
          </div>
          <div className="flex -space-x-1.5">
            {[...Array(Math.min(p.count, 3))].map((_, j) => (
              <div key={j} className="w-5 h-5 rounded-full border-2 shrink-0"
                style={{ background: "var(--border)", borderColor: "var(--surface-2)" }} />
            ))}
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.24 }}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border-dashed border-2"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--surface)" }}>
          <span className="text-base leading-none" style={{ color: "var(--muted)" }}>+</span>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>New project</p>
      </motion.div>
    </div>
  );
}

function ArtifactsVisual() {
  const types = [
    { label: "Images",   icon: <Image size={16} weight="fill" color="#7474ee" />, bg: "#ede8ff" },
    { label: "Video",    icon: <FilmStrip size={16} weight="fill" color="#f97316" />, bg: "#fff3eb" },
    { label: "Websites", icon: <Globe size={16} weight="fill" color="#3b9ec7" />, bg: "#e8f4fb" },
    { label: "Figma",    icon: <PenNib size={16} weight="fill" color="#4caf7d" />, bg: "#eaf6ef" },
    { label: "HTML",     icon: <Code size={16} weight="bold" color="#e05c5c" />, bg: "#fdeaea" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 py-4 gap-0">
      {/* Plus button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", zIndex: 1 }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, color: "var(--foreground)", marginTop: -1 }}>+</span>
      </motion.div>

      {/* Vertical line from + down to horizontal bar */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.25, delay: 0.2, ease: "easeOut" }}
        style={{ width: 1, height: 16, background: "rgba(0,0,0,0.15)", transformOrigin: "top", flexShrink: 0 }}
      />

      {/* Cards row with branching lines */}
      <div className="relative w-full flex justify-around items-start">
        {/* Horizontal connector line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          className="absolute"
          style={{ top: 0, left: "10%", right: "10%", height: 1, background: "rgba(0,0,0,0.15)", transformOrigin: "center" }}
        />

        {types.map((t, i) => (
          <div key={t.label} className="flex flex-col items-center">
            {/* Short vertical drop from horizontal bar to card */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, delay: 0.38 + i * 0.05, ease: "easeOut" }}
              style={{ width: 1, height: 14, background: "rgba(0,0,0,0.15)", transformOrigin: "top", flexShrink: 0 }}
            />
            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.44 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl p-2 flex flex-col items-center gap-1.5"
              style={{ background: t.bg, width: 60 }}
            >
              {t.icon}
              <p className="text-[9px] font-semibold text-center leading-tight" style={{ color: "rgba(0,0,0,0.6)" }}>{t.label}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareVisual() {
  const [shared, setShared] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center px-5">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <motion.div
          className="rounded-xl overflow-hidden relative"
          style={{ background: "#e8e4f0" }}
        >
          <div className="h-32 w-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d4cfe8 0%, #e8e4f0 100%)" }}>
            <div className="w-12 h-12 rounded-xl opacity-20" style={{ background: "#7474ee" }} />
          </div>
          <motion.button
            onClick={() => setShared((v) => !v)}
            className="absolute top-2.5 right-2.5 rounded-full px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1"
            animate={shared
              ? { background: "#7474ee", color: "#fff", boxShadow: "0 0 0 4px #7474ee28" }
              : { background: "rgba(0,0,0,0.5)", color: "#fff", boxShadow: "0 0 0 0px #7474ee00" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <ShareNetwork size={11} weight={shared ? "fill" : "regular"} />
            {shared ? "Shared" : "Share"}
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={shared ? "on" : "off"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-center font-medium"
            style={{ color: "var(--muted)" }}
          >
            {shared ? "Now visible to the whole team on Explore ✓" : "Tap share to send it to the feed"}
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
    description: "A live feed of artifacts shared by your teammates — work in progress, inspiration, designs, and websites all in one place.",
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
    label: "Artifacts",
    title: "Add anything",
    description: "Upload images and video, paste a website URL, or drop in a Figma file. Each becomes an artifact you can organise, share, and revisit.",
    visual: <ArtifactsVisual />,
  },
  {
    label: "Share",
    title: "Share what you're proud of",
    description: "When an artifact is worth the team's attention, share it to Explore. One tap — everyone sees it.",
    visual: <ShareVisual />,
  },
];

// ── Tour modal ────────────────────────────────────────────────────────────────

export function TourModal({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const isLast = step === STEPS.length - 1;

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir: number) => ({ opacity: 0, x: dir * -32 }),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col pointer-events-auto"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
          >
            <X size={14} weight="bold" />
          </button>

          {/* Visual area */}
          <div className="w-full shrink-0 overflow-hidden" style={{ height: 300, background: "#f5f4f2", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "20px 20px", borderBottom: "1px solid var(--border)" }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                {STEPS[step].visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text + controls */}
          <div className="flex flex-col gap-5 px-6 py-5">
            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 18 : 6,
                    height: 6,
                    background: i === step ? "var(--foreground)" : "var(--border)",
                  }}
                />
              ))}
            </div>

            {/* Text */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-1.5 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  {STEPS[step].label}
                </p>
                <h2 className="text-xl font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                  {STEPS[step].title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {STEPS[step].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button
                  onClick={() => go(step - 1)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                  style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={onSkip}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                  style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Skip
                </button>
              )}
              <button
                onClick={isLast ? onDone : () => go(step + 1)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
              >
                {isLast ? "Get started" : <>Next <ArrowRight size={14} weight="bold" /></>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
