"use client";

import { useState, useRef } from "react";
import { ArrowClockwise, Code } from "@phosphor-icons/react";

interface HtmlRendererProps {
  htmlContent: string;
  maxWidth?: number;
  maxHeight?: number;
}

export function HtmlRenderer({ htmlContent, maxWidth = 1100, maxHeight }: HtmlRendererProps) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const containerHeight = maxHeight ?? 700;

  function reload() {
    setLoaded(false);
    setKey((k) => k + 1);
  }

  return (
    <div
      className="flex flex-col gap-3 select-none"
      style={{ width: maxWidth }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 h-10 shrink-0"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <Code size={14} className="text-[var(--muted)] shrink-0" />
        <span className="flex-1 text-xs text-[var(--muted)] font-mono truncate">
          HTML Document
        </span>
        <button
          onClick={reload}
          title="Reload"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowClockwise size={14} />
        </button>
      </div>

      {/* iframe */}
      <div
        className="relative rounded-2xl overflow-hidden shrink-0"
        style={{
          width: maxWidth,
          height: containerHeight,
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-2)]">
            <div
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(8px)" }}
            >
              Rendering…
            </div>
          </div>
        )}
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={htmlContent}
          title="HTML preview"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          className="absolute inset-0 w-full h-full"
          style={{
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
