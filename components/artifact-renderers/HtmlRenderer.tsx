"use client";

import { useState, useRef } from "react";
import { ArrowSquareOut, ArrowClockwise, Desktop, DeviceMobile, DeviceTablet, FileCode } from "@phosphor-icons/react";

const SCREEN_DIMS: Record<string, { width: number; height: number }> = {
  DESKTOP: { width: 1440, height: 900 },
  TABLET:  { width: 768,  height: 1024 },
  MOBILE:  { width: 390,  height: 844 },
};

const SIZE_ICONS = {
  DESKTOP: Desktop,
  TABLET:  DeviceTablet,
  MOBILE:  DeviceMobile,
};

interface HtmlRendererProps {
  /** R2 public URL of the uploaded HTML file */
  url: string;
  fileName?: string;
  screenSize?: string | null;
  screenshotUrl?: string | null;
  maxWidth?: number;
  maxHeight?: number;
}

export function HtmlRenderer({
  url,
  fileName,
  screenSize = "DESKTOP",
  screenshotUrl,
  maxWidth = 880,
  maxHeight,
}: HtmlRendererProps) {
  const [activeSize, setActiveSize] = useState(screenSize ?? "DESKTOP");
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dims = SCREEN_DIMS[activeSize] ?? SCREEN_DIMS.DESKTOP;

  let scale = Math.min(1, maxWidth / dims.width);
  if (maxHeight) {
    const CHROME_HEIGHT = 52; // bar 40px + gap 12px
    const availableH = maxHeight - CHROME_HEIGHT;
    scale = Math.min(scale, availableH / dims.height);
  }

  const scaledW = Math.round(dims.width * scale);
  const scaledH = Math.round(dims.height * scale);

  function reload() {
    setLoaded(false);
    setKey((k) => k + 1);
  }

  function changeSize(s: string) {
    setActiveSize(s);
    setLoaded(false);
    setKey((k) => k + 1);
  }

  const displayName = fileName ?? "artifact.html";

  return (
    <div className="flex flex-col gap-3 select-none" style={{ width: scaledW }}>

      {/* ── Chrome bar ── */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 h-10 shrink-0"
        style={{
          width: scaledW,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Viewport size toggles */}
        <div className="flex items-center gap-0.5 shrink-0">
          {(Object.keys(SCREEN_DIMS) as (keyof typeof SIZE_ICONS)[]).map((s) => {
            const Icon = SIZE_ICONS[s];
            return (
              <button
                key={s}
                onClick={() => changeSize(s)}
                title={s[0] + s.slice(1).toLowerCase()}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeSize === s
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={14} weight={activeSize === s ? "fill" : "regular"} />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[var(--border)] shrink-0" />

        {/* Filename */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <FileCode size={14} className="shrink-0 opacity-50" />
          <span className="text-xs text-[var(--muted)] truncate font-mono">{displayName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={reload}
            title="Reload"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowClockwise size={14} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open raw file"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </div>

      {/* ── iframe ── */}
      <div
        className="relative rounded-2xl overflow-hidden shrink-0"
        style={{
          width: scaledW,
          height: scaledH,
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* Screenshot shown as background while iframe loads */}
        {screenshotUrl && !loaded && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotUrl}
            alt="Loading preview…"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        )}

        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
            <div
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(8px)" }}
            >
              Loading…
            </div>
          </div>
        )}

        <iframe
          key={key}
          ref={iframeRef}
          src={url}
          title="HTML preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: dims.width,
            height: dims.height,
            transform: `scale(${scale})`,
            border: "none",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
