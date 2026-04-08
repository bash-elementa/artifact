"use client";

import { useState, useRef } from "react";

interface MediaRendererProps {
  url: string;
  mimeType?: string | null;
  alt?: string;
}

export function MediaRenderer({ url, mimeType, alt = "" }: MediaRendererProps) {
  const isVideo = mimeType?.startsWith("video/");
  const isGif = mimeType === "image/gif";
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (isVideo) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={url}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="max-w-full max-h-full object-contain rounded-xl"
        />
        {/* Audio toggle */}
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
