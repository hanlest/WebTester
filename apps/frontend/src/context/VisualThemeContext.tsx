import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { VISUAL_THEMES, type VisualThemeId } from "@web-tester/shared";

const STORAGE_KEY = "web-tester.visualTheme";

interface VisualThemeContextValue {
  theme: VisualThemeId;
  setTheme: (theme: VisualThemeId) => void;
  themes: typeof VISUAL_THEMES;
}

const VisualThemeContext = createContext<VisualThemeContextValue | null>(null);

export function VisualThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<VisualThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as VisualThemeId | null;
    if (saved && VISUAL_THEMES.some((t) => t.id === saved)) return saved;
    return "default";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-visual-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: VisualThemeId) => setThemeState(next);

  return (
    <VisualThemeContext.Provider value={{ theme, setTheme, themes: VISUAL_THEMES }}>
      {children}
    </VisualThemeContext.Provider>
  );
}

export function useVisualTheme() {
  const ctx = useContext(VisualThemeContext);
  if (!ctx) throw new Error("useVisualTheme must be used within VisualThemeProvider");
  return ctx;
}
