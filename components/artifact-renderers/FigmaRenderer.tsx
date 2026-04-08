"use client";

import { useState } from "react";

interface FigmaRendererProps {
  figmaUrl: string;
  figmaPreviewUrl?: string | null;
  name?: string;
}

export function FigmaRenderer({ figmaUrl, figmaPreviewUrl, name = "" }: FigmaRendererProps) {
  const [embedFailed, setEmbedFailed] = useState(false);

  const embedUrl = `https://www.figma.com/embed?embed_host=playground&url=${encodeURIComponent(figmaUrl)}`;

  if (embedFailed && figmaPreviewUrl) {
    return (
      <div className="flex flex-col items-center gap-3 w-full h-full">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--muted)]">
          Live embed unavailable — showing static preview
        </div>
        <div className="flex-1 flex items-center justify-center w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={figmaPreviewUrl} alt={name} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      </div>
    );
  }

  if (embedFailed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-center">
        <div className="text-3xl opacity-40">✦</div>
        <p className="text-sm text-[var(--muted)]">Figma embed unavailable.</p>
        <a
          href={figmaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] underline"
        >
          Open in Figma →
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        title={name}
        className="w-full h-full"
        allowFullScreen
        onError={() => setEmbedFailed(true)}
        style={{ border: "none" }}
      />
    </div>
  );
}
