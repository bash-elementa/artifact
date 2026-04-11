"use client";

import { useState, useRef } from "react";
import { ArrowSquareOut, ArrowClockwise, Desktop, DeviceMobile, DeviceTablet } from "@phosphor-icons/react";

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

interface UrlRendererProps {
  url: string;
  screenSize?: string | null;
  screenshotUrl?: string | null;
  /** Max pixel width the render can occupy (default 880) */
  maxWidth?: number;
  /** Max pixel height the render can occupy — used to fit within a lightbox */
  maxHeight?: number;
}

function proxyUrl(url: string) {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

function isFigmaUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    // figma.com and *.figma.com block iframes (design viewer)
    // *.figma.site are Figma Make published web apps — they load fine in the proxy iframe
    return host === "figma.com" || host.endsWith(".figma.com");
  } catch {
    return false;
  }
}

function truncateUrl(url: string, max = 42) {
  try {
    const u = new URL(url);
    const display = u.hostname + (u.pathname !== "/" ? u.pathname : "");
    return display.length > max ? display.slice(0, max) + "…" : display;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

export function UrlRenderer({
  url,
  screenSize = "DESKTOP",
  screenshotUrl,
  maxWidth = 880,
  maxHeight,
}: UrlRendererProps) {
  const [activeSize, setActiveSize] = useState(screenSize ?? "DESKTOP");
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isFigma = isFigmaUrl(url);
  const dims = SCREEN_DIMS[activeSize] ?? SCREEN_DIMS.DESKTOP;

  // Scale to fit width constraint
  let scale = Math.min(1, maxWidth / dims.width);

  // Also scale to fit height constraint if provided (account for chrome bar ~52px + gap)
  if (maxHeight) {
    const CHROME_HEIGHT = 52; // bar 40px + gap 12px
    const availableH = maxHeight - CHROME_HEIGHT;
    const scaleForH = availableH / dims.height;
    scale = Math.min(scale, scaleForH);
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

  return (
    <div className="flex flex-col gap-3 select-none" style={{ width: scaledW }}>

      {/* ── Browser chrome bar — width locked to the render viewport ── */}
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

        {/* URL */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=16`}
            alt=""
            className="w-4 h-4 rounded shrink-0 opacity-70"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-xs text-[var(--muted)] truncate font-mono">{truncateUrl(url)}</span>
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
            title="Open in new tab"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </div>

      {/* ── iframe container (or screenshot-only for Figma URLs) ── */}
      <div
        className="relative rounded-2xl overflow-hidden shrink-0"
        style={{
          width: scaledW,
          height: scaledH,
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {isFigma ? (
          /* Figma blocks iframes — show screenshot and prompt to open */
          screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={screenshotUrl}
              alt="Figma preview"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2)]">
              <span className="text-4xl opacity-20">✦</span>
            </div>
          )
        ) : (
          <>
            {/* Screenshot shown as background while proxy loads */}
            {screenshotUrl && !loaded && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotUrl}
                alt="Loading preview…"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            )}

            {/* Loading badge */}
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
                <div
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(8px)" }}
                >
                  Loading live preview…
                </div>
              </div>
            )}

            <iframe
              key={key}
              ref={iframeRef}
              src={proxyUrl(url)}
              title="URL preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
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
          </>
        )}
      </div>
    </div>
  );
}
