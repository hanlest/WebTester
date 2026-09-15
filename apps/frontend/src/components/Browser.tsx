import { useEffect, useRef, useState } from "react";
import type { ScreencastFrame, LogMessage } from "@web-tester/shared";
import "./Browser.css";

interface BrowserProps {
  sessionId: string;
}

export function Browser({ sessionId }: BrowserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: number }>>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/ws/session/${sessionId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "screencast") {
        const frame = msg.payload as ScreencastFrame;
        const canvas = canvasRef.current;
        if (canvas) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          };
          img.src = `data:image/jpeg;base64,${frame.data}`;
        }
      } else if (msg.type === "log") {
        const logMsg = msg.payload as LogMessage["payload"];
        setLogs((prev) => [...prev, logMsg]);
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
