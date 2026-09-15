import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import "./Browser.css";
export function Browser({ sessionId }) {
    const canvasRef = useRef(null);
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:3001/ws/session/${sessionId}`);
        ws.onopen = () => {
            console.log("WebSocket connected");
        };
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "screencast") {
                const frame = msg.payload;
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
            }
            else if (msg.type === "log") {
                const logMsg = msg.payload;
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
    return (_jsxs("div", { className: "browser", children: [_jsx("div", { className: "canvas-wrapper", children: _jsx("canvas", { ref: canvasRef, width: 1280, height: 720 }) }), _jsxs("div", { className: "logs", children: [_jsx("div", { className: "logs-header", children: "Activity Log" }), _jsxs("div", { className: "logs-content", children: [logs.map((log, idx) => (_jsxs("div", { className: `log-entry log-${log.level}`, children: [_jsx("span", { className: "log-time", children: new Date(log.timestamp).toLocaleTimeString() }), _jsx("span", { className: "log-message", children: log.message })] }, idx))), _jsx("div", { ref: logsEndRef })] })] })] }));
}
//# sourceMappingURL=Browser.js.map