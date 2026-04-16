"use client";

import { useState } from "react";

interface MediaRendererProps {
  url: string;
  mimeType?: string | null;
  alt?: string;
  maxHeight?: string;
}

/** Extract a Cloudflare Stream UID from an HLS or delivery URL. */
function getCFStreamUID(url: string): string | null {
  const m = url.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i);
  return m ? m[1] : null;
}

function isHLS(url: string): boolean {
  return url.includes(".m3u8") || !!getCFStreamUID(url);
}

export function MediaRenderer({ url, mimeType, alt = "", maxHeight = "80vh" }: MediaRendererProps) {
  const isVideo = mimeType?.startsWith("video/");
  const isGif = mimeType === "image/gif";
  const [muted, setMuted] = useState(true);

  if (isVideo) {
    const uid = getCFStreamUID(url);

    // HLS / Cloudflare Stream → use the official iframe embed (works in all browsers)
    if (uid || isHLS(url)) {
      const embedUrl = uid
        ? `https://iframe.videodelivery.net/${uid}?autoplay=true&muted=true&loop=true&controls=true`
        : url;
      return (
        <div style={{ width: "min(90vw, 960px)", aspectRatio: "16/9", position: "relative" }}>
          <iframe
            src={embedUrl}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-xl"
            style={{ border: "none" }}
          />
        </div>
      );
    }

    // Direct video file (uploaded to R2 or pasted link)
    return (
      <div className="relative">
        <video
          src={url}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="block rounded-xl"
          style={{ maxWidth: "90vw", maxHeight, objectFit: "contain" }}
        />
        <button
          onClick={() => setMuted(!muted)}
          className="absolute bottom-4 right-4 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors"
        >
          {muted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="block rounded-xl"
        style={{ maxWidth: "90vw", maxHeight, objectFit: "contain" }}
      />
    </div>
  );
}
