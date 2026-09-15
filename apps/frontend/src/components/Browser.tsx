import { useEffect, useRef, useState } from "react";
import type { ScreencastFrame, LogMessage } from "@web-tester/shared";
import "./Browser.css";

interface BrowserProps {
  sessionId: string;
}

export function Browser({ sessionId }: BrowserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: number }>>([]);
  const [frameCount, setFrameCount] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/ws/session/${sessionId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setLogs((prev) => [...prev, { level: "info", message: "WebSocket connected", timestamp: Date.now() }]);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "screencast") {
          const frame = msg.payload as ScreencastFrame;
          const canvas = canvasRef.current;
          if (canvas && frame.data) {
            const img = new Image();
            img.onload = () => {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setFrameCount((prev) => prev + 1);
              }
            };
            img.onerror = () => {
              console.error("Failed to load image frame");
              setLogs((prev) => [...prev, { level: "error", message: "Failed to load image frame", timestamp: Date.now() }]);
            };
            img.src = `data:image/jpeg;base64,${frame.data}`;
          }
        } else if (msg.type === "log") {
          const logMsg = msg.payload as LogMessage["payload"];
          setLogs((prev) => [...prev, logMsg]);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setLogs((prev) => [...prev, { level: "error", message: "WebSocket error", timestamp: Date.now() }]);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="browser">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={1280} height={720} />
        {frameCount > 0 && <div className="frame-counter">Frames: {frameCount}</div>}
      </div>
      <div className="logs">
        <div className="logs-header">Activity Log</div>
        <div className="logs-content">
          {logs.map((log, idx) => (
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
