import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "lander-bot-theme";

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}>((set, get) => ({
  theme: typeof document !== "undefined" ? readTheme() : "dark",
  setTheme: (theme) => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));

if (typeof document !== "undefined") {
  applyTheme(readTheme());
}
