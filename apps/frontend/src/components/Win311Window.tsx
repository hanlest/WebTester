import { useEffect, useRef, type ReactNode } from "react";

export function Win311MenuBar() {
  return (
    <div className="win311-menu-bar" role="presentation">
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
    <div className="win311-window-marks" aria-hidden>
      <span className="win311-mark-top-rail-tl" />
      <span className="win311-mark-side-rail-tl" />
      <span className="win311-mark-top-rail-tr" />
      <span className="win311-mark-side-rail-tr" />
      <span className="win311-mark-bottom-rail-bl" />
      <span className="win311-mark-side-rail-bl" />
      <span className="win311-mark-bottom-rail-br" />
      <span className="win311-mark-side-rail-br" />
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
    <div ref={clientRef} className="win311-window-client">
      {children}
    </div>
  );
}

export function Win311Window({ title, children, className = "" }: Win311WindowProps) {
  return (
    <div className={`win311-window ${className}`.trim()}>
      <Win311WindowFrameMarks />
      <div className="win311-window-inner">
        <div className="win311-window-chrome">
          <div className="win311-window-titlebar">
            <button type="button" className="win311-title-btn win311-title-sys" tabIndex={-1} aria-hidden="true">
              <span className="win311-title-icon win311-title-icon-sys" />
            </button>
            <span className="win311-title-controls-split" aria-hidden="true" />
            <span className="win311-window-title">{title}</span>
            <div className="win311-title-controls">
              <span className="win311-title-controls-split" aria-hidden="true" />
              <button type="button" className="win311-title-btn" tabIndex={-1} aria-hidden="true">
                <span className="win311-title-icon win311-title-icon-down" />
              </button>
              <span className="win311-title-controls-split" aria-hidden="true" />
              <button type="button" className="win311-title-btn" tabIndex={-1} aria-hidden="true">
                <span className="win311-title-icon win311-title-icon-up" />
              </button>
            </div>
          </div>
          <Win311MenuBar />
          <Win311WindowClient>{children}</Win311WindowClient>
        </div>
      </div>
    </div>
  );
}
