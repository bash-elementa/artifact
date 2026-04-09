"use client";

import { useState } from "react";

interface MediaRendererProps {
  url: string;
  mimeType?: string | null;
  alt?: string;
}

/** Extract a Cloudflare Stream UID from an HLS or delivery URL. */
function getCFStreamUID(url: string): string | null {
  const m = url.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-f0-9]+)/i);
  return m ? m[1] : null;
}

function isHLS(url: string): boolean {
  return url.includes(".m3u8") || !!getCFStreamUID(url);
}

export function MediaRenderer({ url, mimeType, alt = "" }: MediaRendererProps) {
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
        <div className="relative w-full h-full flex items-center justify-center">
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
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          src={url}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="max-w-full max-h-full object-contain rounded-xl"
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
    <div className="w-full h-full flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-xl"
        style={isGif ? { imageRendering: "auto" } : {}}
      />
    </div>
  );
}
