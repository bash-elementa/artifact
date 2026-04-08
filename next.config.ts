import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "**.figma.com",
      },
    ],
  },
};

export default nextConfig;
