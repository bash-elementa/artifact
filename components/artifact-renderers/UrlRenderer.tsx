"use client";

import { useState, useRef } from "react";

const SCREEN_DIMS: Record<string, { width: number; height: number }> = {
  DESKTOP: { width: 1512, height: 900 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 390, height: 844 },
};

interface UrlRendererProps {
  url: string;
  screenSize?: string | null;
  screenshotUrl?: string | null;
}

export function UrlRenderer({ url, screenSize = "DESKTOP", screenshotUrl }: UrlRendererProps) {
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [activeSize, setActiveSize] = useState(screenSize ?? "DESKTOP");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dims = SCREEN_DIMS[activeSize] ?? SCREEN_DIMS.DESKTOP;
  const scale = Math.min(1, 800 / dims.width);

  if (iframeBlocked && screenshotUrl) {
    return (
      <div className="flex flex-col items-center gap-3 w-full h-full">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--muted)]">
          Live preview unavailable — showing screenshot
        </div>
        <div className="flex-1 flex items-center justify-center w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshotUrl} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      </div>
    );
  }

  if (iframeBlocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-center">
        <div className="text-3xl opacity-40">🔒</div>
        <p className="text-sm text-[var(--muted)]">This site blocks embedding.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] underline"
        >
          Open in new tab →
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Size toggle */}
      <div className="flex gap-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] p-0.5">
        {Object.keys(SCREEN_DIMS).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSize(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeSize === s
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {s[0] + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* iframe container */}
      <div
        className="relative overflow-hidden rounded-xl border border-[var(--border)] shadow-2xl"
        style={{ width: dims.width * scale, height: dims.height * scale }}
      >
        <iframe
          ref={iframeRef}
          src={url}
          title="URL preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: dims.width,
            height: dims.height,
            transform: `scale(${scale})`,
            border: "none",
          }}
          onError={() => setIframeBlocked(true)}
          onLoad={(e) => {
            try {
              // Try to access the iframe — throws if blocked by CSP/X-Frame-Options
              const _ = (e.currentTarget as HTMLIFrameElement).contentWindow?.location.href;
              void _;
            } catch {
              setIframeBlocked(true);
            }
          }}
        />
      </div>
    </div>
  );
}
