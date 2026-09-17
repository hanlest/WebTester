import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVisualTheme } from "../context/VisualThemeContext";
import { Win95StartLogo } from "./Win95Taskbar";
import { WIN95_MENU_STATUS_HINTS } from "../win95-status-hints";

export function Win311MenuBar() {
  const { theme } = useVisualTheme();
  if (theme === "win95") {
    return (
      <div className="retro-menu-shell">
        <div className="retro-menu-bar" role="menubar">
          <div className="retro-menu-bar-raised">
            <span className="retro-menu-grip" aria-hidden="true" />
            <div className="retro-menu-items">
              <span title={WIN95_MENU_STATUS_HINTS.file}><u>F</u>ile</span>
              <span title={WIN95_MENU_STATUS_HINTS.edit}><u>E</u>dit</span>
              <span title={WIN95_MENU_STATUS_HINTS.view}><u>V</u>iew</span>
              <span title={WIN95_MENU_STATUS_HINTS.help}><u>H</u>elp</span>
            </div>
          </div>
          <span
            className="retro-menu-brand"
            aria-hidden="true"
            title="Web Tester: aplicación de pruebas automatizadas con navegador remoto y asistente de IA."
          >
            <Win95StartLogo />
          </span>
        </div>
      </div>
    );
  }
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

function Win311TitleControls() {
  const { theme } = useVisualTheme();
  const isWin95 = theme === "win95";

  if (isWin95) {
    return (
      <div className="retro-title-controls">
        <button type="button" className="retro-title-btn" tabIndex={-1} aria-hidden="true">
          <span className="retro-title-icon retro-title-icon-min" />
        </button>
        <button type="button" className="retro-title-btn" tabIndex={-1} aria-hidden="true">
          <span className="retro-title-icon retro-title-icon-max" />
        </button>
        <button type="button" className="retro-title-btn retro-title-close" tabIndex={-1} aria-hidden="true">
          <span className="retro-title-icon retro-title-icon-close" />
        </button>
      </div>
    );
  }

  return (
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
  );
}

function statusHintFromElement(target: EventTarget | null, boundary: Element): string {
  if (!(target instanceof Element)) return "";
  let node: Element | null = target;
  while (node && node !== boundary) {
    const title = node.getAttribute("title");
    if (title) return title;
    const alt = node.getAttribute("alt");
    if (alt) return alt;
    node = node.parentElement;
  }
  return "";
}

interface Win311WindowChromeProps {
  title: string;
  children: ReactNode;
  isWin95: boolean;
  isMacClassic: boolean;
  showLeadingChrome: boolean;
}

function Win311WindowChrome({
  title,
  children,
  isWin95,
  isMacClassic,
  showLeadingChrome,
}: Win311WindowChromeProps) {
  const chromeRef = useRef<HTMLDivElement>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!isWin95) return;
    const root = chromeRef.current;
    if (!root) return;

    const onMove = (e: MouseEvent) => {
      setStatusText(statusHintFromElement(e.target, root));
    };
    const onLeave = () => setStatusText("");

    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);
    return () => {
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, [isWin95]);

  return (
    <div ref={chromeRef} className="retro-window-chrome">
      <div className="retro-window-titlebar">
            <div className="retro-titlebar-leading">
              {showLeadingChrome ? (
                <button type="button" className="retro-title-btn retro-title-sys" tabIndex={-1} aria-hidden="true">
                  {isWin95 ? (
                    <span className="retro-title-icon retro-title-icon-sys retro-title-icon-explorer" aria-hidden="true">
                      <span className="retro-title-icon-folder" />
                      <span className="retro-title-icon-search" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="retro-title-icon retro-title-icon-sys" />
                  )}
                </button>
              ) : null}
              {isWin95 ? <span className="retro-window-title">{title}</span> : null}
              {showLeadingChrome && !isWin95 ? <span className="retro-title-controls-split" aria-hidden="true" /> : null}
            </div>
            {!isWin95 ? (
              <div className="retro-titlebar-center">
                <span className="retro-window-title">{title}</span>
              </div>
            ) : null}
            <div className="retro-titlebar-trailing">
              {isMacClassic ? (
                <span className="retro-titlebar-trailing-spacer" aria-hidden="true" />
              ) : (
                <Win311TitleControls />
              )}
            </div>
      </div>
      <Win311MenuBar />
      <Win311WindowClient>{children}</Win311WindowClient>
      {isWin95 ? (
        <div className="retro-window-statusbar" role="status" aria-live="polite">
          {statusText}
        </div>
      ) : null}
    </div>
  );
}

export function Win311Window({ title, children, className = "" }: Win311WindowProps) {
  const { theme } = useVisualTheme();
  const isMacClassic = theme === "mac-classic-ii";
  const isWin95 = theme === "win95";
  const showLeadingChrome = !isMacClassic;

  return (
    <div className={`retro-window ${className}`.trim()}>
      <Win311WindowFrameMarks />
      <div className="retro-window-inner">
        <Win311WindowChrome
          title={title}
          isWin95={isWin95}
          isMacClassic={isMacClassic}
          showLeadingChrome={showLeadingChrome}
        >
          {children}
        </Win311WindowChrome>
      </div>
    </div>
  );
}
