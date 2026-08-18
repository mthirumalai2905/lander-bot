const NAMED_COLORS: Record<string, string> = {
  red: "#FF0000",
  black: "#111111",
  green: "#22C55E",
  blue: "#2563EB",
  yellow: "#EAB308",
  purple: "#7C3AED",
  orange: "#F97316",
  pink: "#EC4899",
  cyan: "#06B6D4",
  teal: "#14B8A6",
  white: "#FFFFFF",
  gray: "#6B7280",
  grey: "#6B7280",
  magenta: "#FF00FF",
  violet: "#8B5CF6",
  indigo: "#4F46E5",
};

export const PALETTE = [
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#2563EB",
  "#7C3AED",
  "#EC4899",
  "#06B6D4",
  "#111111",
];

export function namedColor(name: string): string | null {
  const key = name.trim().toLowerCase();
  return NAMED_COLORS[key] ?? null;
}

export function normalizeColor(value: string): string {
  const named = namedColor(value);
  if (named) return named;
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

export function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export const RAINBOW = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#2563EB",
  "#7C3AED",
  "#EC4899",
];

export function rainbowPalette(count: number): string[] {
  const size = Math.min(Math.max(count, 1), 12);
  return Array.from({ length: size }, (_, index) => RAINBOW[index % RAINBOW.length]);
}

export function rampSpeeds(count: number): number[] {
  const size = Math.min(Math.max(count, 1), 12);
  if (size === 1) return [0.4];
  return Array.from({ length: size }, (_, index) => {
    const t = index / (size - 1);
    return Number((0.35 + t * 2.25).toFixed(2));
  });
}
