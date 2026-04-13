import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appUrl = "https://artifact-bash.vercel.app";
const bannerUrl = `${appUrl}/artifact-banner.png`;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Artifact — Bash",
    template: "%s",
  },
  description: "An internal creative sharing platform for Bash.",
  openGraph: {
    title: "Artifact — Bash",
    description: "An internal creative sharing platform for Bash.",
    siteName: "/artifact",
    images: [{ url: bannerUrl, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artifact — Bash",
    description: "An internal creative sharing platform for Bash.",
    images: [bannerUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <main className="flex-1 flex flex-col min-h-0 pb-32 md:pb-0">{children}</main>
      </body>
    </html>
  );
}
