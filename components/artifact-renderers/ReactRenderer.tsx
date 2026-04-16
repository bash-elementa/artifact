"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowSquareOut, ArrowClockwise, Desktop, DeviceMobile, DeviceTablet, Atom } from "@phosphor-icons/react";

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

interface ReactRendererProps {
  /** R2 public URL of the uploaded JSX/TSX file */
  url: string;
  fileName?: string;
  screenSize?: string | null;
  screenshotUrl?: string | null;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Transforms a typical Claude-generated React component into a self-contained
 * HTML document that runs with CDN React + Babel Standalone.
 *
 * Handles:
 *  - import React, { useState, ... } from 'react'  →  const { useState, ... } = React;
 *  - import ReactDOM from 'react-dom'               →  (removed, global)
 *  - export default function App / export default App  →  function App (exposed as global)
 *  - Named exports like export function App         →  function App
 *  - Injects Tailwind CSS (Claude almost always uses it)
 *  - Injects lucide-react shim (very common in Claude output)
 */
function buildSrcdoc(code: string): string {
  let processed = code;

  // 1. Strip React + ReactDOM import lines, capture destructured hooks
  const reactHooks: string[] = [];
  processed = processed.replace(
    /^import\s+React(?:\s*,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?\s*$/gm,
    (_, named) => {
      if (named) reactHooks.push(...named.split(",").map((s: string) => s.trim()).filter(Boolean));
      return "";
    }
  );
  // import { useState, ... } from 'react'  (without React default)
  processed = processed.replace(
    /^import\s+\{([^}]*)\}\s+from\s+['"]react['"];?\s*$/gm,
    (_, named) => {
      reactHooks.push(...named.split(",").map((s: string) => s.trim()).filter(Boolean));
      return "";
    }
  );
  // import ReactDOM from 'react-dom' / 'react-dom/client'
  processed = processed.replace(
    /^import\s+ReactDOM\s+from\s+['"]react-dom(?:\/client)?['"];?\s*$/gm,
    ""
  );

  // 2. Unwrap named export modifiers, capture default export component name
  let appName = "App";
  // export default function Foo  →  function Foo
  processed = processed.replace(
    /^export\s+default\s+function\s+(\w+)/gm,
    (_, name) => { appName = name; return `function ${name}`; }
  );
  // export default class Foo  →  class Foo
  processed = processed.replace(
    /^export\s+default\s+class\s+(\w+)/gm,
    (_, name) => { appName = name; return `class ${name}`; }
  );
  // export default Foo  (bare identifier)
  processed = processed.replace(
    /^export\s+default\s+(\w+)\s*;?\s*$/gm,
    (_, name) => { appName = name; return ""; }
  );
  // export function Foo / export const Foo
  processed = processed.replace(/^export\s+(function|const|class|let|var)\s+/gm, "$1 ");
  // remaining export { ... } lines
  processed = processed.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, "");

  // 3. Build hook destructure line
  const uniqueHooks = [...new Set(reactHooks)].filter(Boolean);
  const hooksLine = uniqueHooks.length > 0
    ? `const { ${uniqueHooks.join(", ")} } = React;\n`
    : "";

  // 4. Wrap everything in a full HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Tailwind CSS (Claude almost always uses it) -->
  <script src="https://cdn.tailwindcss.com"><\/script>
  <!-- React + ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <!-- Babel Standalone (JSX + modern JS) -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${hooksLine}${processed}

// Mount — works whether the component is named App or anything else
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(${appName}));
} catch (e) {
  document.getElementById('root').innerHTML =
    '<div style="padding:2rem;color:#ef4444;font-family:monospace">' +
    '<b>Render error:</b><br>' + e.message + '</div>';
}
  <\/script>
</body>
</html>`;
}

export function ReactRenderer({
  url,
  fileName,
  screenSize = "DESKTOP",
  screenshotUrl,
  maxWidth = 880,
  maxHeight,
}: ReactRendererProps) {
  const [activeSize, setActiveSize] = useState(screenSize ?? "DESKTOP");
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dims = SCREEN_DIMS[activeSize] ?? SCREEN_DIMS.DESKTOP;
  let scale = Math.min(1, maxWidth / dims.width);
  if (maxHeight) {
    const CHROME_HEIGHT = 52;
    scale = Math.min(scale, (maxHeight - CHROME_HEIGHT) / dims.height);
  }
  const scaledW = Math.round(dims.width * scale);
  const scaledH = Math.round(dims.height * scale);

  // Fetch code once on mount
  useEffect(() => {
    setLoadError(null);
    setSrcdoc(null);
    setIframeReady(false);
    fetch(`/api/fetch-code?url=${encodeURIComponent(url)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(({ content }: { content: string }) => setSrcdoc(buildSrcdoc(content)))
      .catch((e) => setLoadError(String(e)));
  }, [url]);

  function reload() {
    setIframeReady(false);
    setKey((k) => k + 1);
  }

  function changeSize(s: string) {
    setActiveSize(s);
    setIframeReady(false);
    setKey((k) => k + 1);
  }

  const displayName = fileName ?? "component.jsx";

  return (
    <div className="flex flex-col gap-3 select-none" style={{ width: scaledW }}>

      {/* ── Chrome bar ── */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 h-10 shrink-0"
        style={{ width: scaledW, background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {/* Viewport toggles */}
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

        <div className="w-px h-4 bg-[var(--border)] shrink-0" />

        {/* Filename */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <Atom size={14} className="shrink-0 opacity-50" />
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
            title="Open source file"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </div>

      {/* ── Preview ── */}
      <div
        className="relative rounded-2xl overflow-hidden shrink-0"
        style={{
          width: scaledW,
          height: scaledH,
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* Error state */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-2)]">
            <p className="text-xs text-red-400 px-4 text-center font-mono">{loadError}</p>
          </div>
        )}

        {/* Screenshot shown as background while loading */}
        {screenshotUrl && !iframeReady && !loadError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotUrl}
            alt="Loading preview…"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        )}

        {/* Loading badge */}
        {!iframeReady && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
            <div
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(8px)" }}
            >
              {srcdoc ? "Rendering…" : "Loading…"}
            </div>
          </div>
        )}

        {srcdoc && (
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={srcdoc}
            title="React preview"
            sandbox="allow-scripts"
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${scale})`,
              border: "none",
              opacity: iframeReady ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onLoad={() => setIframeReady(true)}
          />
        )}
      </div>
    </div>
  );
}
