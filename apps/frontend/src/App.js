import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { DEVICE_PROFILES } from "@web-tester/shared";
import { Browser } from "./components/Browser";
import { TestRunner } from "./components/TestRunner";
import { BACKEND_URL } from "./config";
import "./App.css";
export function App() {
    const [url, setUrl] = useState("https://example.com");
    const [deviceProfile, setDeviceProfile] = useState("desktop");
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("browser");
    const handleStart = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, deviceProfile }),
            });
            const data = await res.json();
            if (data.sessionId) {
                setSessionId(data.sessionId);
            }
            else {
                alert("Failed to start session");
            }
        }
        catch (error) {
            console.error(error);
            alert("Error: " + String(error));
        }
        finally {
            setLoading(false);
        }
    };
    const handleStop = async () => {
        if (!sessionId)
            return;
        try {
            await fetch(`${BACKEND_URL}/api/session/${sessionId}/stop`, { method: "POST" });
            setSessionId(null);
        }
        catch (error) {
            console.error(error);
        }
    };
    return (_jsxs("div", { className: "app", children: [_jsxs("div", { className: "sidebar", children: [_jsx("h1", { children: "Web Tester" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Target URL" }), _jsx("input", { type: "text", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://example.com", disabled: !!sessionId })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Device Profile" }), _jsx("select", { value: deviceProfile, onChange: (e) => setDeviceProfile(e.target.value), disabled: !!sessionId, children: Object.entries(DEVICE_PROFILES).map(([key, { name }]) => (_jsx("option", { value: key, children: name }, key))) })] }), !sessionId ? (_jsx("button", { onClick: handleStart, disabled: loading || !url, children: loading ? "Starting..." : "Start Session" })) : (_jsx("button", { onClick: handleStop, className: "stop-btn", children: "Stop Session" })), sessionId && _jsxs("div", { className: "session-info", children: ["Session: ", sessionId] })] }), _jsx("div", { className: "content", children: sessionId && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tabs", children: [_jsx("button", { className: `tab ${activeTab === "browser" ? "active" : ""}`, onClick: () => setActiveTab("browser"), children: "\uD83D\uDCF9 Live Browser" }), _jsx("button", { className: `tab ${activeTab === "test" ? "active" : ""}`, onClick: () => setActiveTab("test"), children: "\uD83E\uDD16 AI Test" })] }), activeTab === "browser" && _jsx(Browser, { sessionId: sessionId }), activeTab === "test" && _jsx(TestRunner, { sessionId: sessionId })] })) })] }));
}
//# sourceMappingURL=App.js.map