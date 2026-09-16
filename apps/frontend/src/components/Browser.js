import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { BACKEND_WS_URL } from "../config";
import "./Browser.css";
export function Browser({ sessionId }) {
    const canvasRef = useRef(null);
    const [logs, setLogs] = useState([]);
    const [frameCount, setFrameCount] = useState(0);
    const logsEndRef = useRef(null);
    useEffect(() => {
        const ws = new WebSocket(`${BACKEND_WS_URL}/ws/session/${sessionId}`);
        ws.onopen = () => {
            console.log("WebSocket connected");
            setLogs((prev) => [...prev, { level: "info", message: "WebSocket connected", timestamp: Date.now() }]);
        };
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "screencast") {
                    const frame = msg.payload;
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
                }
                else if (msg.type === "log") {
                    const logMsg = msg.payload;
                    setLogs((prev) => [...prev, logMsg]);
                }
            }
            catch (err) {
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
    return (_jsxs("div", { className: "browser", children: [_jsxs("div", { className: "canvas-wrapper", children: [_jsx("canvas", { ref: canvasRef, width: 1280, height: 720 }), frameCount > 0 && _jsxs("div", { className: "frame-counter", children: ["Frames: ", frameCount] })] }), _jsxs("div", { className: "logs", children: [_jsx("div", { className: "logs-header", children: "Activity Log" }), _jsxs("div", { className: "logs-content", children: [logs.map((log, idx) => (_jsxs("div", { className: `log-entry log-${log.level}`, children: [_jsx("span", { className: "log-time", children: new Date(log.timestamp).toLocaleTimeString() }), _jsx("span", { className: "log-message", children: log.message })] }, idx))), _jsx("div", { ref: logsEndRef })] })] })] }));
}
//# sourceMappingURL=Browser.js.map