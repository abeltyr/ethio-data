export type Point = { x: string; y: number };

/** Semantic chart/figure tones — map to design tokens, never raw colors. */
export type Tone = "primary" | "gold" | "negative" | "positive" | "neutral";

/** A computed analytical finding: a headline number, what it is, and what it means. */
export type Finding = {
  stat: string;
  label: string;
  detail: string;
  tone?: Tone;
};
