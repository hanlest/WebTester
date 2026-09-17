import { useEffect, useState } from "react";

export function Win95StartLogo() {
  return (
    <svg className="win95-start-logo" width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" fill="#ff0000" stroke="#000" strokeWidth="1" />
      <rect x="9" y="1" width="6" height="6" fill="#00ff00" stroke="#000" strokeWidth="1" />
      <rect x="1" y="8" width="6" height="5" fill="#0000ff" stroke="#000" strokeWidth="1" />
      <rect x="9" y="8" width="6" height="5" fill="#ffff00" stroke="#000" strokeWidth="1" />
      <path d="M0 4 L0 10 M0 6 L-2 6" stroke="#000" strokeWidth="1" fill="none" />
    </svg>
  );
}

function formatWin95Clock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function TraySpeakerIcon() {
  return (
    <svg className="win95-tray-speaker" width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <path d="M2 5 H5 L8 2 V12 L5 9 H2 Z" fill="#000" />
      <path d="M10 5 Q12 7 10 9 M11 3 Q14 7 11 11" fill="none" stroke="#000" strokeWidth="1" />
      <rect x="12" y="4" width="3" height="6" fill="#ffcc00" stroke="#000" strokeWidth="1" />
    </svg>
  );
}

export interface Win95TaskbarTask {
  id: string;
  label: string;
  pressed?: boolean;
}

interface Win95TaskbarProps {
  tasks: Win95TaskbarTask[];
  onTaskClick?: (id: string) => void;
}

export function Win95Taskbar({ tasks, onTaskClick }: Win95TaskbarProps) {
  const [clock, setClock] = useState(() => formatWin95Clock(new Date()));

  useEffect(() => {
    const tick = () => setClock(formatWin95Clock(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="win95-taskbar" role="contentinfo">
      <button type="button" className="win95-taskbar-start" aria-label="Start">
        <Win95StartLogo />
        <span className="win95-taskbar-start-label">Start</span>
      </button>
      <div className="win95-taskbar-tasks" role="list">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            role="listitem"
            className={`win95-taskbar-task${task.pressed ? " is-pressed" : ""}`}
            onClick={() => onTaskClick?.(task.id)}
          >
            <span className="win95-taskbar-task-label">{task.label}</span>
          </button>
        ))}
      </div>
      <div className="win95-taskbar-tray" aria-label="Notification area">
        <span className="win95-taskbar-tray-icons" aria-hidden="true">
          <TraySpeakerIcon />
        </span>
        <time className="win95-taskbar-clock" dateTime={new Date().toISOString()}>
          {clock}
        </time>
      </div>
    </footer>
  );
}
