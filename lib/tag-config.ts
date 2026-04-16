export const TAG_CONFIG = {
  work:  { bg: "#7474ee", text: "#ffffff", label: "Work" },
  inspo: { bg: "#f97316", text: "#ffffff", label: "Inspo" },
} as const;

export type ArtifactTag = keyof typeof TAG_CONFIG;
