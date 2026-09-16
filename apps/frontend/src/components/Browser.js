import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { DEVICE_PROFILES } from "@web-tester/shared";
import "./Browser.css";
export function Browser({ deviceProfile, browserLogs, screencastPaused, subscribeScreencast }) {
    const canvasRef = useRef(null);
    const [frameCount, setFrameCount] = useState(0);
    const logsEndRef = useRef(null);
    const { width: viewportWidth, height: viewportHeight } = DEVICE_PROFILES[deviceProfile].viewport;
    useEffect(() => {
        return subscribeScreencast((frame) => {
            const canvas = canvasRef.current;
            if (!canvas || !frame.data)
                return;
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
    return (_jsxs("div", { className: "browser", children: [_jsxs("div", { className: "canvas-wrapper", style: { aspectRatio: `${viewportWidth} / ${viewportHeight}` }, children: [_jsx("canvas", { ref: canvasRef, width: viewportWidth, height: viewportHeight }), frameCount > 0 && _jsxs("div", { className: "frame-counter", children: ["Frames: ", frameCount] }), screencastPaused && _jsx("div", { className: "screencast-paused", children: "Vista en pausa" })] }), _jsxs("div", { className: "logs", children: [_jsx("div", { className: "logs-header", children: "Activity Log" }), _jsxs("div", { className: "logs-content", children: [browserLogs.map((log, idx) => (_jsxs("div", { className: `log-entry log-${log.level}`, children: [_jsx("span", { className: "log-time", children: new Date(log.timestamp).toLocaleTimeString() }), _jsx("span", { className: "log-message", children: log.message })] }, idx))), _jsx("div", { ref: logsEndRef })] })] })] }));
}
//# sourceMappingURL=Browser.js.map