"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TegakiRenderer } from "tegaki/react";
import type { TegakiRendererHandle, TegakiBundle } from "tegaki/react";
import { createBundle } from "tegaki";
import { ArrowRight } from "@phosphor-icons/react";
import { LoadingDots } from "@/components/ui/LoadingDots";

async function loadFont(): Promise<TegakiBundle> {
  const glyphData = await fetch("/fonts/caveat-glyphs.json").then((r) => r.json());
  return createBundle({ family: "Caveat", fontUrl: "/fonts/caveat.ttf", glyphData });
}

const TEAMS = [
  "Product", "Data", "Engineering", "Experience Design", "Catalogue",
  "Omni Operations", "Brand Experience", "Operations", "Growth",
  "People Ops", "Digital Marketing", "Finance", "Retail",
  "Supply Chain", "Business Development", "Rewards", "Management",
];

type Phase = "onboarding" | "loading" | "welcome";
type Step = 1 | 2 | 3 | 4;


export default function HelloPage() {
  const [font, setFont] = useState<TegakiBundle | null>(null);
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [step, setStep] = useState<Step>(1);

  const [nameInput, setNameInput] = useState("");
  const [displayName, setDisplayName] = useState("hello");
  const [confirmedName, setConfirmedName] = useState("");
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [roleInput, setRoleInput] = useState("");
  const [displayRole, setDisplayRole] = useState("");
  const roleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

  const rendererRef = useRef<TegakiRendererHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFont().then(setFont);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (phase === "onboarding") inputRef.current?.focus();
  }, [step, phase]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNameInput(val);
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => setDisplayName(val.trim() || "hello"), 350);
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setRoleInput(val);
    if (roleDebounceRef.current) clearTimeout(roleDebounceRef.current);
    roleDebounceRef.current = setTimeout(() => setDisplayRole(val.trim()), 250);
  }

  function handleNameContinue() {
    const name = nameInput.trim();
    if (!name) return;
    setConfirmedName(name);
    setDisplayName(name);
    setStep(2);
  }

  function handleRoleContinue() {
    if (!roleInput.trim()) return;
    setStep(3);
  }

  function handleTeamContinue() {
    if (!selectedTeam) return;
    setStep(4);
  }

  async function handlePhotoContinue() {
    setPhase("loading");

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const res = await fetch("/api/upload/media", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          avatarUrl = data.url;
        }
      }

      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: confirmedName,
          role: roleInput.trim(),
          team: selectedTeam,
          ...(avatarUrl && { avatarUrl }),
        }),
      });
    } catch {
      // proceed to welcome regardless
    }

    setPhase("welcome");
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        localStorage.setItem("show-tour", "1");
        window.location.replace("/explore");
      }, 700);
    }, 2000);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleBack() {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  }

  const canContinue =
    step === 1 ? !!nameInput.trim() :
    step === 2 ? !!roleInput.trim() :
    step === 3 ? !!selectedTeam :
    true; // photo is optional

  const handleContinue =
    step === 1 ? handleNameContinue :
    step === 2 ? handleRoleContinue :
    step === 3 ? handleTeamContinue :
    handlePhotoContinue;

  return (
    <>
      <style>{`
        @font-face {
          font-family: "Caveat";
          src: url("/fonts/caveat.ttf") format("truetype");
          font-weight: normal;
          font-weight: normal;
          font-style: normal;
        }
        .hello-input::placeholder { color: var(--muted); }
        .hello-input { caret-color: var(--foreground); }
        .hello-input::selection { background: var(--border); }
      `}</style>

      <div className="relative w-screen h-screen overflow-hidden select-none bg-[var(--background)]" style={{
          backgroundImage: "radial-gradient(circle, rgba(4,4,4,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute rounded-full" style={{
            width: 900, height: 700, top: "5%", left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(116,116,238,0.07) 0%, transparent 65%)",
          }} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── Onboarding steps ── */}
          {phase === "onboarding" && (
            <motion.div
              key="onboarding"
              className="absolute inset-0 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Center content: name/role/team OR avatar upload */}
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-12 min-h-0">
                <AnimatePresence mode="wait">
                  {step < 4 ? (
                    <motion.div
                      key="text"
                      className="flex flex-col items-center gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {font ? (
                        <TegakiRenderer
                          key={displayName}
                          ref={rendererRef}
                          font={font}
                          time={{ mode: "uncontrolled", speed: 2 }}
                          style={{
                            fontSize: "clamp(64px, 14vw, 180px)",
                            color: "var(--foreground-solid)",
                            lineHeight: 1.2,
                            maxWidth: "88vw",
                            textAlign: "center",
                            display: "block",
                          }}
                        >
                          {displayName}
                        </TegakiRenderer>
                      ) : (
                        <span style={{
                          fontSize: "clamp(64px, 14vw, 180px)",
                          color: "var(--border)",
                          fontFamily: "Georgia, serif",
                          fontStyle: "italic",
                        }}>
                          hello
                        </span>
                      )}

                      {displayRole ? (
                        <p className="text-xl md:text-2xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)", fontWeight: 400 }}>
                          {displayRole}
                        </p>
                      ) : step === 2 && (
                        <p className="text-xl md:text-2xl" style={{ color: "var(--border)", fontFamily: "var(--font-sans)" }}>&nbsp;</p>
                      )}

                      {selectedTeam && (
                        <p className="text-base md:text-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-sans)", fontWeight: 400 }}>
                          {selectedTeam}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="avatar"
                      className="flex flex-col items-center gap-5"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-40 h-40 rounded-full overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{
                          background: "var(--surface)",
                          border: avatarPreview ? "none" : "2px dashed var(--border)",
                        }}
                      >
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                        )}
                      </button>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        {avatarPreview ? "Tap to change" : "Tap to add a photo"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Team chips */}
              <AnimatePresence>
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-wrap gap-2 justify-center px-8 pb-4 overflow-y-auto max-h-52"
                >
                  {TEAMS.map((team) => (
                    <button
                      key={team}
                      onClick={() => setSelectedTeam(team)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
                      style={
                        selectedTeam === team
                          ? { background: "var(--accent)", color: "var(--accent-fg)", border: "1px solid transparent" }
                          : { background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }
                      }
                    >
                      {team}
                    </button>
                  ))}
                </motion.div>
              )}
              </AnimatePresence>

              <div className="h-20 shrink-0" />

              {/* Control bar */}
              <div className="absolute bottom-7 inset-x-0 flex justify-center px-6">
                <div className="glass flex items-center gap-1.5 rounded-full px-3 py-2.5">
                  {step > 1 && (
                    <>
                      <BackButton onClick={handleBack} />
                      <div className="w-px h-4 mx-0.5 bg-[var(--border)]" />
                    </>
                  )}

                  {step < 3 ? (
                    <input
                      ref={inputRef}
                      key={step}
                      type="text"
                      value={step === 1 ? nameInput : roleInput}
                      onChange={step === 1 ? handleNameChange : handleRoleChange}
                      onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                      placeholder={step === 1 ? "Type your name" : "Enter your role at Bash"}
                      maxLength={step === 1 ? 40 : 60}
                      className="hello-input text-[var(--foreground)] text-sm font-medium text-center outline-none border-none w-56 sm:w-72 md:w-80 px-2"
                      style={{ background: "transparent" }}
                    />
                  ) : step === 3 ? (
                    <span className="text-sm w-56 sm:w-72 md:w-80 px-2 text-center" style={{ color: selectedTeam ? "var(--foreground)" : "var(--muted)" }}>
                      {selectedTeam || "Choose your team"}
                    </span>
                  ) : (
                    <span className="text-sm w-56 sm:w-72 md:w-80 px-2 text-center" style={{ color: "var(--muted)" }}>
                      {avatarFile ? avatarFile.name : "Add a profile photo"}
                    </span>
                  )}

                  <div className="w-px h-4 mx-0.5 bg-[var(--border)]" />
                  <ContinueButton disabled={!canContinue} onClick={handleContinue} skip={step === 4 && !avatarFile} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Loading ── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              className="absolute inset-0 flex flex-col items-center justify-center gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <LoadingDots size={10} gap={8} color="var(--foreground-solid)" jumpHeight={14} />
              <p className="text-sm" style={{ color: "var(--muted)", fontFamily: "var(--font-sans)" }}>
                Setting up your profile
              </p>
            </motion.div>
          )}

          {/* ── Welcome ── */}
          {phase === "welcome" && (
            <motion.div
              key="welcome"
              className="absolute inset-0 flex items-center justify-center text-center px-12"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", color: "var(--foreground)", lineHeight: 1.3, fontWeight: 500 }}>
                Welcome to /artifact,{" "}
                <span style={{
                  fontFamily: "var(--font-sans)",
                  color: "rgba(4,4,4,0.35)",
                }}>
                  {confirmedName}
                </span>
              </p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Full-page fade-out before navigating to /explore */}
        <AnimatePresence>
          {exiting && (
            <motion.div
              key="exit-fade"
              className="absolute inset-0 z-50"
              style={{ background: "var(--background)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function ContinueButton({ onClick, disabled, skip }: { onClick: () => void; disabled: boolean; skip?: boolean }) {
  return skip ? (
    <button
      onClick={onClick}
      className="h-9 px-4 flex items-center justify-center rounded-full shrink-0 text-sm font-medium transition-all duration-150"
      style={{ color: "var(--muted)", background: "transparent" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
    >
      Skip
    </button>
  ) : (
    <button
      onClick={onClick}
      title="Continue"
      disabled={disabled}
      className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all duration-150 disabled:opacity-30"
      style={{ color: "var(--accent-fg)", background: "var(--accent)" }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
    >
      <ArrowRight size={18} weight="bold" />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Back"
      className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all duration-150"
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
