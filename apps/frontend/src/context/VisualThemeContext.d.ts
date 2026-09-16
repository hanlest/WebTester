import { type ReactNode } from "react";
import { VISUAL_THEMES, type VisualThemeId } from "@web-tester/shared";
interface VisualThemeContextValue {
    theme: VisualThemeId;
    setTheme: (theme: VisualThemeId) => void;
    themes: typeof VISUAL_THEMES;
}
export declare function VisualThemeProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useVisualTheme(): VisualThemeContextValue;
export {};
//# sourceMappingURL=VisualThemeContext.d.ts.map