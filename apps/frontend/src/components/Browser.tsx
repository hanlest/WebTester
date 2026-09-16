import { useEffect, useRef, useState } from "react";
import type { ScreencastFrame } from "@web-tester/shared";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import type { BrowserLogEntry } from "../hooks/useSessionWebSocket";
import "./Browser.css";

interface BrowserProps {
  deviceProfile: DeviceProfile;
  browserLogs: BrowserLogEntry[];
  screencastPaused: boolean;
  subscribeScreencast: (listener: (frame: ScreencastFrame) => void) => () => void;
}

export function Browser({ deviceProfile, browserLogs, screencastPaused, subscribeScreencast }: BrowserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameCount, setFrameCount] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { width: viewportWidth, height: viewportHeight } = DEVICE_PROFILES[deviceProfile].viewport;

  useEffect(() => {
    return subscribeScreencast((frame) => {
      const canvas = canvasRef.current;
      if (!canvas || !frame.data) return;

      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setFrameCount((prev) => prev + 1);
        }
      };
      img.src = `data:image/jpeg;base64,${frame.data}`;
    });
  }, [subscribeScreencast]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [browserLogs]);

  return (
    <div className="browser">
      <div className="canvas-wrapper" style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}>
        <canvas ref={canvasRef} width={viewportWidth} height={viewportHeight} />
        {frameCount > 0 && <div className="frame-counter">Frames: {frameCount}</div>}
        {screencastPaused && <div className="screencast-paused">Vista en pausa</div>}
      </div>
      <div className="logs">
        <div className="logs-header">Activity Log</div>
        <div className="logs-content">
          {browserLogs.map((log, idx) => (
            <div key={idx} className={`log-entry log-${log.level}`}>
              <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
