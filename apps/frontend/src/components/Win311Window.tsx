import { useEffect, useRef, type ReactNode } from "react";
import { useVisualTheme } from "../context/VisualThemeContext";

export function Win311MenuBar() {
  return (
    <div className="retro-menu-bar" role="presentation">
      <span><u>F</u>ile</span>
      <span><u>O</u>ptions</span>
      <span><u>W</u>indow</span>
      <span><u>H</u>elp</span>
    </div>
  );
}

interface Win311WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function Win311WindowFrameMarks() {
  return (
    <div className="retro-window-marks" aria-hidden>
      <span className="retro-mark-top-rail-tl" />
      <span className="retro-mark-side-rail-tl" />
      <span className="retro-mark-top-rail-tr" />
      <span className="retro-mark-side-rail-tr" />
      <span className="retro-mark-bottom-rail-bl" />
      <span className="retro-mark-side-rail-bl" />
      <span className="retro-mark-bottom-rail-br" />
      <span className="retro-mark-side-rail-br" />
    </div>
  );
}

function Win311WindowClient({ children }: { children: ReactNode }) {
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = clientRef.current;
    if (!el) return;

    const update = () => {
      el.classList.toggle("has-vertical-scrollbar", el.scrollHeight > el.clientHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [children]);

  return (
    <div ref={clientRef} className="retro-window-client">
      {children}
    </div>
  );
}

export function Win311Window({ title, children, className = "" }: Win311WindowProps) {
  const { theme } = useVisualTheme();
  const isMacClassic = theme === "mac-classic-ii";

  return (
    <div className={`retro-window ${className}`.trim()}>
      <Win311WindowFrameMarks />
      <div className="retro-window-inner">
        <div className="retro-window-chrome">
          <div className="retro-window-titlebar">
            <div className="retro-titlebar-leading">
              <button type="button" className="retro-title-btn retro-title-sys" tabIndex={-1} aria-hidden="true">
                {!isMacClassic ? <span className="retro-title-icon retro-title-icon-sys" /> : null}
              </button>
              {!isMacClassic ? <span className="retro-title-controls-split" aria-hidden="true" /> : null}
            </div>
            <div className="retro-titlebar-center">
              <span className="retro-window-title">{title}</span>
            </div>
            <div className="retro-titlebar-trailing">
              {isMacClassic ? (
                <span className="retro-titlebar-trailing-spacer" aria-hidden="true" />
              ) : (
                <div className="retro-title-controls">
                  <span className="retro-title-controls-split" aria-hidden="true" />
                  <button type="button" className="retro-title-btn" tabIndex={-1} aria-hidden="true">
                    <span className="retro-title-icon retro-title-icon-down" />
                  </button>
                  <span className="retro-title-controls-split" aria-hidden="true" />
                  <button type="button" className="retro-title-btn" tabIndex={-1} aria-hidden="true">
                    <span className="retro-title-icon retro-title-icon-up" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <Win311MenuBar />
          <Win311WindowClient>{children}</Win311WindowClient>
        </div>
      </div>
    </div>
  );
}
