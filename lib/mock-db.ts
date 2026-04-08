/**
 * In-memory mock database for pre-auth / pre-database development.
 * All data resets on server restart. Swap this out for Prisma calls when DB is ready.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  team: string;
  bio: string;
}

export interface MockProject {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockArtifact {
  id: string;
  name: string;
  description: string | null;
  type: "MEDIA" | "URL" | "FIGMA" | "INSPO";
  isShareable: boolean;
  isSharedToFeed: boolean;
  storageBytes: number;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  websiteUrl: string | null;
  screenSize: "DESKTOP" | "TABLET" | "MOBILE" | null;
  screenshotUrl: string | null;
  figmaUrl: string | null;
  figmaPreviewUrl: string | null;
  sourceUrl: string | null;
  sourceCredit: string | null;
  tags: string[];
  userId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MockReaction {
  id: string;
  emoji: string;
  userId: string;
  artifactId: string;
  createdAt: string;
}

// ─── Seed users ─────────────────────────────────────────────────────────────

export const USERS: MockUser[] = [
  {
    id: "mock-user-1",
    name: "Alex Bash",
    email: "alex@bash.com",
    image: null,
    role: "Product Designer",
    team: "XD",
    bio: "Building cool things at Bash.",
  },
  {
    id: "user-2",
    name: "Jordan Kim",
    email: "jordan@bash.com",
    image: null,
    role: "Senior Engineer",
    team: "ENGINEERING",
    bio: "Loves clean APIs and fast UIs.",
  },
  {
    id: "user-3",
    name: "Priya Nair",
    email: "priya@bash.com",
    image: null,
    role: "Creative Director",
    team: "STUDIO",
    bio: "Pixels, motion, and stories.",
  },
  {
    id: "user-4",
    name: "Sam Okafor",
    email: "sam@bash.com",
    image: null,
    role: "Product Manager",
    team: "PRODUCT",
    bio: "Turning roadmaps into reality.",
  },
];

// ─── Seed projects ───────────────────────────────────────────────────────────

export const projects: MockProject[] = [
  {
    id: "proj-1",
    name: "Brand Refresh 2026",
    description: "Visual explorations for the new Bash brand direction.",
    userId: "mock-user-1",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: "proj-2",
    name: "Mobile Onboarding",
    description: "Redesign of the first-time user experience on iOS and Android.",
    userId: "mock-user-1",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: "proj-3",
    name: "Design System Tokens",
    description: null,
    userId: "mock-user-1",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
];

// ─── Seed artifacts ──────────────────────────────────────────────────────────

export const artifacts: MockArtifact[] = [
  // ── Shared media (Explore feed) ──
  {
    id: "art-1",
    name: "Brand Mark Exploration",
    description: "Early-stage logo explorations for the 2026 rebrand.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 1200000,
    mediaUrl: "https://picsum.photos/seed/bash1/800/600",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["branding", "logo"],
    userId: "mock-user-1",
    projectId: "proj-1",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
    deletedAt: null,
  },
  {
    id: "art-2",
    name: "Colour System v3",
    description: "New palette — warmer neutrals, punchy accent.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 980000,
    mediaUrl: "https://picsum.photos/seed/bash2/900/700",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["colour", "branding"],
    userId: "mock-user-1",
    projectId: "proj-1",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
    deletedAt: null,
  },
  {
    id: "art-3",
    name: "Onboarding Flow — Step 1",
    description: "First screen of the new mobile onboarding. Minimal, no friction.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 750000,
    mediaUrl: "https://picsum.photos/seed/bash3/600/900",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["mobile", "onboarding"],
    userId: "mock-user-1",
    projectId: "proj-2",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
    deletedAt: null,
  },
  {
    id: "art-4",
    name: "Type Scale Specimen",
    description: "Geist + custom heading weights in action.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 430000,
    mediaUrl: "https://picsum.photos/seed/bash4/1000/600",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["typography", "design-system"],
    userId: "mock-user-1",
    projectId: "proj-3",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    deletedAt: null,
  },
  // ── Shared by other team members (for Explore diversity) ──
  {
    id: "art-5",
    name: "Dashboard Prototype",
    description: "Interactive Figma prototype for the analytics dashboard.",
    type: "FIGMA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 0,
    mediaUrl: null,
    mediaMimeType: null,
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/dashboard",
    figmaPreviewUrl: "https://picsum.photos/seed/bash5/900/600",
    sourceUrl: null,
    sourceCredit: null,
    tags: ["dashboard", "prototype"],
    userId: "user-2",
    projectId: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    deletedAt: null,
  },
  {
    id: "art-6",
    name: "Campaign Landing Page",
    description: "Spring 2026 campaign microsite — live preview.",
    type: "URL",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 0,
    mediaUrl: null,
    mediaMimeType: null,
    websiteUrl: "https://linear.app",
    screenSize: "DESKTOP",
    screenshotUrl: "https://iad.microlink.io/yg-MY6eG0tNNEQAtC-OYNZCGGG6RwEJg8kELiv5gApKDWau4Lds44GEfHmPRqrHUMKQmzG50HX5T8HIHk1o6Jw.png",
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["campaign", "web"],
    userId: "user-3",
    projectId: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    deletedAt: null,
  },
  {
    id: "art-7",
    name: "Icon Library Preview",
    description: "200+ icons in the new rounded style. Still a WIP.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 1800000,
    mediaUrl: "https://picsum.photos/seed/bash7/800/800",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["icons", "design-system"],
    userId: "user-3",
    projectId: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    deletedAt: null,
  },
  {
    id: "art-8",
    name: "Q2 Roadmap Visual",
    description: "One-pager for the all-hands.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 620000,
    mediaUrl: "https://picsum.photos/seed/bash8/1100/700",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["strategy", "roadmap"],
    userId: "user-4",
    projectId: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    deletedAt: null,
  },
  {
    id: "art-9",
    name: "Motion Principles",
    description: "Easing curves and timing guidelines for all product animations.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 340000,
    mediaUrl: "https://picsum.photos/seed/bash9/700/500",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["motion", "design-system"],
    userId: "mock-user-1",
    projectId: "proj-3",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    deletedAt: null,
  },
  {
    id: "art-10",
    name: "Spacing & Grid Spec",
    description: "The 8pt grid system, documented.",
    type: "FIGMA",
    isShareable: true,
    isSharedToFeed: true,
    storageBytes: 0,
    mediaUrl: null,
    mediaMimeType: null,
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/spacing",
    figmaPreviewUrl: "https://picsum.photos/seed/bash10/1000/700",
    sourceUrl: null,
    sourceCredit: null,
    tags: ["grid", "design-system"],
    userId: "mock-user-1",
    projectId: "proj-3",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
    deletedAt: null,
  },
  // ── Additional shared artifacts for Explore testing ──
  {
    id: "art-13",
    name: "Dark Mode Explorations",
    description: "Testing contrast ratios across all surface levels.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 890000,
    mediaUrl: "https://picsum.photos/seed/bash13/1200/600", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["dark-mode", "design-system"],
    userId: "user-2", projectId: null, createdAt: daysAgo(5), updatedAt: daysAgo(5), deletedAt: null,
  },
  {
    id: "art-14",
    name: "Notification Center Redesign",
    description: "Grouping and priority logic rethought.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 710000,
    mediaUrl: "https://picsum.photos/seed/bash14/500/700", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["notifications", "mobile"],
    userId: "user-3", projectId: null, createdAt: daysAgo(3), updatedAt: daysAgo(3), deletedAt: null,
  },
  {
    id: "art-15",
    name: "Illustration Style Guide",
    description: "Line weights, fills, and perspective rules for product illustrations.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 1400000,
    mediaUrl: "https://picsum.photos/seed/bash15/900/900", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["illustration", "brand"],
    userId: "user-3", projectId: null, createdAt: daysAgo(11), updatedAt: daysAgo(11), deletedAt: null,
  },
  {
    id: "art-16",
    name: "Search UX Concepts",
    description: "Three directions for the global search experience.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/search",
    figmaPreviewUrl: "https://picsum.photos/seed/bash16/1100/650",
    sourceUrl: null, sourceCredit: null, tags: ["search", "ux"],
    userId: "user-2", projectId: null, createdAt: daysAgo(6), updatedAt: daysAgo(6), deletedAt: null,
  },
  {
    id: "art-17",
    name: "Empty State Illustrations",
    description: "Zero-data moments — friendly, not apologetic.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 560000,
    mediaUrl: "https://picsum.photos/seed/bash17/700/480", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["illustration", "empty-states"],
    userId: "mock-user-1", projectId: "proj-2", createdAt: daysAgo(13), updatedAt: daysAgo(13), deletedAt: null,
  },
  {
    id: "art-18",
    name: "Button Component Audit",
    description: "Cataloguing every button variant across the product.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 430000,
    mediaUrl: "https://picsum.photos/seed/bash18/1300/500", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["components", "design-system"],
    userId: "mock-user-1", projectId: "proj-3", createdAt: daysAgo(4), updatedAt: daysAgo(4), deletedAt: null,
  },
  {
    id: "art-19",
    name: "App Store Screenshots",
    description: "v3.2 screenshots optimised for conversion.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 2100000,
    mediaUrl: "https://picsum.photos/seed/bash19/400/850", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["app-store", "marketing"],
    userId: "user-4", projectId: null, createdAt: daysAgo(7), updatedAt: daysAgo(7), deletedAt: null,
  },
  {
    id: "art-20",
    name: "Competitor Teardown",
    description: "UX patterns worth stealing — and some to avoid.",
    type: "URL", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: "https://notion.so", screenSize: "DESKTOP",
    screenshotUrl: "https://iad.microlink.io/-AHXXGNmuhWDFzylTEscxQ3ZGrfJxu_HwrriKvhSHnUC1JH7z35AWEz7h5NmY7RxzvkEdSuyzwlQilLaLIZBFA.png",
    figmaUrl: null, figmaPreviewUrl: null, sourceUrl: null, sourceCredit: null, tags: ["research", "competitive"],
    userId: "user-4", projectId: null, createdAt: daysAgo(9), updatedAt: daysAgo(9), deletedAt: null,
  },
  {
    id: "art-21",
    name: "Logo Grid Poster",
    description: "All logo variants on a single sheet.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 1700000,
    mediaUrl: "https://picsum.photos/seed/bash21/850/850", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["logo", "branding"],
    userId: "user-3", projectId: null, createdAt: daysAgo(16), updatedAt: daysAgo(16), deletedAt: null,
  },
  {
    id: "art-22",
    name: "Loading States Kit",
    description: "Skeleton screens, spinners, and progress patterns.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/loading",
    figmaPreviewUrl: "https://picsum.photos/seed/bash22/960/640",
    sourceUrl: null, sourceCredit: null, tags: ["loading", "components"],
    userId: "user-2", projectId: null, createdAt: daysAgo(8), updatedAt: daysAgo(8), deletedAt: null,
  },
  {
    id: "art-23",
    name: "Card Anatomy",
    description: "Every part of a card — labelled and dimensioned.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 390000,
    mediaUrl: "https://picsum.photos/seed/bash23/1050/700", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["components", "design-system"],
    userId: "mock-user-1", projectId: "proj-3", createdAt: daysAgo(2), updatedAt: daysAgo(2), deletedAt: null,
  },
  {
    id: "art-24",
    name: "Responsive Breakpoints",
    description: "How each layout adapts from 320 to 1920.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 820000,
    mediaUrl: "https://picsum.photos/seed/bash24/1600/500", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["responsive", "layout"],
    userId: "user-2", projectId: null, createdAt: daysAgo(10), updatedAt: daysAgo(10), deletedAt: null,
  },
  {
    id: "art-25",
    name: "Profile Page V2",
    description: "Leaning into the bio and social links more.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 670000,
    mediaUrl: "https://picsum.photos/seed/bash25/540/960", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["profile", "mobile"],
    userId: "user-3", projectId: null, createdAt: daysAgo(5), updatedAt: daysAgo(5), deletedAt: null,
  },
  {
    id: "art-26",
    name: "Pricing Page Concepts",
    description: "Three pricing table layouts — annual toggle and all.",
    type: "URL", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: "https://vercel.com/pricing", screenSize: "DESKTOP",
    screenshotUrl: "https://iad.microlink.io/Cb0Z5PMujwjSIdr5HePzPIM8uwYmJQckHZdqX8Yq7ZvveS1OwDxTAgvEcqPGyvtQce-QG7eRobrOqIXFJ2rXcg.png",
    figmaUrl: null, figmaPreviewUrl: null, sourceUrl: null, sourceCredit: null, tags: ["pricing", "marketing"],
    userId: "user-4", projectId: null, createdAt: daysAgo(3), updatedAt: daysAgo(3), deletedAt: null,
  },
  {
    id: "art-27",
    name: "Error Page System",
    description: "404, 500, offline — consistent tone across all failure modes.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 500000,
    mediaUrl: "https://picsum.photos/seed/bash27/780/580", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["errors", "ux"],
    userId: "mock-user-1", projectId: "proj-2", createdAt: daysAgo(18), updatedAt: daysAgo(18), deletedAt: null,
  },
  {
    id: "art-28",
    name: "Onboarding — Step 3",
    description: "The permissions ask. Softened, contextual.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 460000,
    mediaUrl: "https://picsum.photos/seed/bash28/430/760", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["mobile", "onboarding"],
    userId: "mock-user-1", projectId: "proj-2", createdAt: daysAgo(14), updatedAt: daysAgo(14), deletedAt: null,
  },
  {
    id: "art-29",
    name: "Data Viz Palette",
    description: "8 chart colours that work for everyone, including colour-blind users.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/dataviz",
    figmaPreviewUrl: "https://picsum.photos/seed/bash29/1100/550",
    sourceUrl: null, sourceCredit: null, tags: ["data-viz", "accessibility"],
    userId: "user-3", projectId: null, createdAt: daysAgo(20), updatedAt: daysAgo(20), deletedAt: null,
  },
  {
    id: "art-30",
    name: "Microinteraction Library",
    description: "Hover, press, drag — all defined with Lottie specs.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 930000,
    mediaUrl: "https://picsum.photos/seed/bash30/820/620", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["motion", "animation"],
    userId: "user-2", projectId: null, createdAt: daysAgo(6), updatedAt: daysAgo(6), deletedAt: null,
  },
  {
    id: "art-31",
    name: "Toast Notification Patterns",
    description: "Success, error, warning — and their dismissal logic.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 380000,
    mediaUrl: "https://picsum.photos/seed/bash31/1000/500", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["feedback", "components"],
    userId: "user-4", projectId: null, createdAt: daysAgo(4), updatedAt: daysAgo(4), deletedAt: null,
  },
  {
    id: "art-32",
    name: "Sidebar Navigation Options",
    description: "Collapsible vs. icon-only vs. bottom tab — trade-offs mapped.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/nav",
    figmaPreviewUrl: "https://picsum.photos/seed/bash32/900/1100",
    sourceUrl: null, sourceCredit: null, tags: ["navigation", "layout"],
    userId: "user-2", projectId: null, createdAt: daysAgo(7), updatedAt: daysAgo(7), deletedAt: null,
  },
  {
    id: "art-33",
    name: "Gradient Mesh Backgrounds",
    description: "Generative mesh gradients for hero sections.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 2400000,
    mediaUrl: "https://picsum.photos/seed/bash33/1400/900", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["gradients", "visual"],
    userId: "user-3", projectId: null, createdAt: daysAgo(2), updatedAt: daysAgo(2), deletedAt: null,
  },
  {
    id: "art-34",
    name: "Input Field States",
    description: "Default, focused, error, disabled — all variants, all themes.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 340000,
    mediaUrl: "https://picsum.photos/seed/bash34/750/560", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["forms", "components"],
    userId: "mock-user-1", projectId: "proj-3", createdAt: daysAgo(1), updatedAt: daysAgo(1), deletedAt: null,
  },
  {
    id: "art-35",
    name: "Splash Screen Directions",
    description: "A vs B vs C — vote open until Friday.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 660000,
    mediaUrl: "https://picsum.photos/seed/bash35/480/480", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["branding", "mobile"],
    userId: "user-3", projectId: null, createdAt: daysAgo(1), updatedAt: daysAgo(1), deletedAt: null,
  },
  {
    id: "art-36",
    name: "Share Sheet Component",
    description: "Native-feeling share sheet built entirely in SwiftUI-style constraints.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/share",
    figmaPreviewUrl: "https://picsum.photos/seed/bash36/640/1000",
    sourceUrl: null, sourceCredit: null, tags: ["components", "mobile"],
    userId: "user-2", projectId: null, createdAt: daysAgo(9), updatedAt: daysAgo(9), deletedAt: null,
  },
  {
    id: "art-37",
    name: "Brand Font Pairing",
    description: "Display + body — five contenders.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 520000,
    mediaUrl: "https://picsum.photos/seed/bash37/1100/800", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["typography", "brand"],
    userId: "mock-user-1", projectId: "proj-1", createdAt: daysAgo(8), updatedAt: daysAgo(8), deletedAt: null,
  },
  {
    id: "art-38",
    name: "Settings Page Audit",
    description: "Everything in Settings — grouped, pruned, re-ordered.",
    type: "URL", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: "https://craft.do", screenSize: "DESKTOP",
    screenshotUrl: "https://iad.microlink.io/xU4fxZ5W2Ce3EqE0qnUAwaBEkGpfQr593GMBnfYzYtxmmJwC3KFY1p4lOibtlxhhAaGkRzLSXmVH_N_w2tQIRQ.png",
    figmaUrl: null, figmaPreviewUrl: null, sourceUrl: null, sourceCredit: null, tags: ["settings", "ia"],
    userId: "user-4", projectId: null, createdAt: daysAgo(11), updatedAt: daysAgo(11), deletedAt: null,
  },
  {
    id: "art-39",
    name: "Glassmorphism Exploration",
    description: "Frosted glass surfaces — tasteful, not cliché.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 1100000,
    mediaUrl: "https://picsum.photos/seed/bash39/960/960", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["visual", "exploration"],
    userId: "user-3", projectId: null, createdAt: daysAgo(5), updatedAt: daysAgo(5), deletedAt: null,
  },
  {
    id: "art-40",
    name: "Tab Bar Variations",
    description: "Which tab pattern fits the IA best? Four proposals.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 480000,
    mediaUrl: "https://picsum.photos/seed/bash40/560/420", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["navigation", "mobile"],
    userId: "user-2", projectId: null, createdAt: daysAgo(13), updatedAt: daysAgo(13), deletedAt: null,
  },
  {
    id: "art-41",
    name: "Accessibility Checklist",
    description: "WCAG 2.2 AA requirements mapped to each component.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 290000,
    mediaUrl: "https://picsum.photos/seed/bash41/1250/600", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["accessibility", "design-system"],
    userId: "mock-user-1", projectId: "proj-3", createdAt: daysAgo(22), updatedAt: daysAgo(22), deletedAt: null,
  },
  {
    id: "art-42",
    name: "Handoff Annotation Kit",
    description: "Redline specs — consistent, minimal, dev-friendly.",
    type: "FIGMA", isShareable: true, isSharedToFeed: true, storageBytes: 0,
    mediaUrl: null, mediaMimeType: null, websiteUrl: null, screenSize: null, screenshotUrl: null,
    figmaUrl: "https://www.figma.com/file/example/handoff",
    figmaPreviewUrl: "https://picsum.photos/seed/bash42/1050/820",
    sourceUrl: null, sourceCredit: null, tags: ["handoff", "workflow"],
    userId: "user-2", projectId: null, createdAt: daysAgo(17), updatedAt: daysAgo(17), deletedAt: null,
  },
  {
    id: "art-43",
    name: "Colour Contrast Matrix",
    description: "Every foreground/background combo, pass/fail at a glance.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 610000,
    mediaUrl: "https://picsum.photos/seed/bash43/1500/700", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["colour", "accessibility"],
    userId: "user-3", projectId: null, createdAt: daysAgo(25), updatedAt: daysAgo(25), deletedAt: null,
  },
  {
    id: "art-44",
    name: "Widget Gallery",
    description: "Home screen widgets — small, medium, large.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 880000,
    mediaUrl: "https://picsum.photos/seed/bash44/600/800", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["widgets", "mobile"],
    userId: "user-4", projectId: null, createdAt: daysAgo(6), updatedAt: daysAgo(6), deletedAt: null,
  },
  {
    id: "art-45",
    name: "Brand Voice Examples",
    description: "Copy tone across onboarding, errors, and marketing — before/after.",
    type: "MEDIA", isShareable: true, isSharedToFeed: true, storageBytes: 350000,
    mediaUrl: "https://picsum.photos/seed/bash45/1000/750", mediaMimeType: "image/jpeg",
    websiteUrl: null, screenSize: null, screenshotUrl: null, figmaUrl: null, figmaPreviewUrl: null,
    sourceUrl: null, sourceCredit: null, tags: ["copy", "brand"],
    userId: "user-3", projectId: null, createdAt: daysAgo(3), updatedAt: daysAgo(3), deletedAt: null,
  },
  // ── Private artifacts (not shared) ──
  {
    id: "art-11",
    name: "Onboarding Step 2 — WIP",
    description: "Still rough — not ready to share.",
    type: "MEDIA",
    isShareable: true,
    isSharedToFeed: false,
    storageBytes: 520000,
    mediaUrl: "https://picsum.photos/seed/bash11/600/900",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: null,
    sourceCredit: null,
    tags: ["mobile", "onboarding"],
    userId: "mock-user-1",
    projectId: "proj-2",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
    deletedAt: null,
  },
  // ── Inspo (Projects only) ──
  {
    id: "art-12",
    name: "Linear's empty states",
    description: "Love how they handle zero-data moments. Really calming.",
    type: "INSPO",
    isShareable: false,
    isSharedToFeed: false,
    storageBytes: 0,
    mediaUrl: "https://picsum.photos/seed/bash12/800/600",
    mediaMimeType: "image/jpeg",
    websiteUrl: null,
    screenSize: null,
    screenshotUrl: null,
    figmaUrl: null,
    figmaPreviewUrl: null,
    sourceUrl: "https://linear.app",
    sourceCredit: "Linear",
    tags: ["empty-states", "reference"],
    userId: "mock-user-1",
    projectId: "proj-2",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
    deletedAt: null,
  },
];

// ─── Seed reactions ──────────────────────────────────────────────────────────

export const reactions: MockReaction[] = [
  { id: "r-1", emoji: "🔥", userId: "user-2", artifactId: "art-1", createdAt: daysAgo(7) },
  { id: "r-2", emoji: "✨", userId: "user-3", artifactId: "art-1", createdAt: daysAgo(6) },
  { id: "r-3", emoji: "👏", userId: "user-4", artifactId: "art-1", createdAt: daysAgo(5) },
  { id: "r-4", emoji: "❤️", userId: "user-2", artifactId: "art-2", createdAt: daysAgo(5) },
  { id: "r-5", emoji: "✨", userId: "user-4", artifactId: "art-2", createdAt: daysAgo(4) },
  { id: "r-6", emoji: "🔥", userId: "user-3", artifactId: "art-3", createdAt: daysAgo(12) },
  { id: "r-7", emoji: "💡", userId: "user-2", artifactId: "art-4", createdAt: daysAgo(2) },
  { id: "r-8", emoji: "👏", userId: "user-3", artifactId: "art-5", createdAt: daysAgo(3) },
  { id: "r-9", emoji: "✨", userId: "mock-user-1", artifactId: "art-6", createdAt: daysAgo(1) },
  { id: "r-10", emoji: "🔥", userId: "user-4", artifactId: "art-7", createdAt: daysAgo(6) },
  { id: "r-11", emoji: "🔥", userId: "mock-user-1", artifactId: "art-7", createdAt: daysAgo(6) },
  { id: "r-12", emoji: "❤️", userId: "user-3", artifactId: "art-8", createdAt: daysAgo(1) },
  { id: "r-13", emoji: "💡", userId: "user-2", artifactId: "art-9", createdAt: daysAgo(11) },
  { id: "r-14", emoji: "👏", userId: "user-4", artifactId: "art-10", createdAt: daysAgo(8) },
  { id: "r-15", emoji: "✨", userId: "user-2", artifactId: "art-10", createdAt: daysAgo(8) },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getUserById(id: string): MockUser | undefined {
  return USERS.find((u) => u.id === id);
}

export function enrichArtifact(artifact: MockArtifact, currentUserId: string) {
  const user = getUserById(artifact.userId);
  const artifactReactions = reactions.filter((r) => r.artifactId === artifact.id);
  const myReactions = artifactReactions
    .filter((r) => r.userId === currentUserId)
    .map((r) => r.emoji);
  const reactionCounts = artifactReactions.reduce(
    (acc, r) => {
      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    ...artifact,
    user: user
      ? { id: user.id, name: user.name, role: user.role, team: user.team, image: user.image }
      : { id: artifact.userId, name: "Unknown", role: null, team: null, image: null },
    reactions: artifactReactions,
    myReactions,
    reactionCounts,
  };
}

export function enrichProject(project: MockProject) {
  const projectArtifacts = artifacts.filter(
    (a) => a.projectId === project.id && !a.deletedAt
  );
  return {
    ...project,
    artifacts: projectArtifacts.slice(0, 4).map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      mediaUrl: a.mediaUrl,
      figmaPreviewUrl: a.figmaPreviewUrl,
      screenshotUrl: a.screenshotUrl,
    })),
    _count: { artifacts: projectArtifacts.length },
  };
}
