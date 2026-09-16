import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { DEVICE_PROFILES } from "@web-tester/shared";
import { Browser } from "./components/Browser";
import { TestRunner } from "./components/TestRunner";
import { BugsPanel, HistoryPanel, ProjectsPanel, SettingsPanel } from "./components/AdminPanels";
import { useVisualTheme } from "./context/VisualThemeContext";
import { useSessionWebSocket } from "./hooks/useSessionWebSocket";
import { apiGet } from "./api/client";
import { BACKEND_URL } from "./config";
import "./App.css";
export function App() {
    const { theme, setTheme, themes } = useVisualTheme();
    const [view, setView] = useState("session");
    const [url, setUrl] = useState("https://private.estarsiempre.com");
    const [deviceProfile, setDeviceProfile] = useState("desktop");
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [targetApps, setTargetApps] = useState([]);
    const [targetAppId, setTargetAppId] = useState("");
    const [projectId, setProjectId] = useState("");
    const { browserLogs, agentLogs, screencastPaused, subscribeScreencast, clearAgentLogs } = useSessionWebSocket(sessionId);
    useEffect(() => {
        void (async () => {
            try {
                const projects = await apiGet("/api/projects");
                const apps = [];
                for (const p of projects) {
                    const list = await apiGet(`/api/projects/${p.id}/target-apps`);
                    apps.push(...list.map((a) => ({ ...a, projectId: p.id })));
                }
                setTargetApps(apps);
                if (projects[0])
                    setProjectId(projects[0].id);
            }
            catch {
                /* backend offline */
            }
        })();
    }, [view]);
    useEffect(() => {
        const app = targetApps.find((a) => a.id === targetAppId);
        if (app) {
            setUrl(app.url);
            setProjectId(app.projectId);
        }
    }, [targetAppId, targetApps]);
    const handleStart = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    deviceProfile,
                    targetAppId: targetAppId || undefined,
                    projectId: projectId || undefined,
                }),
            });
            const data = await res.json();
            if (data.sessionId) {
                setSessionId(data.sessionId);
                setView("session");
                if (data.navigationError) {
                    alert(`Session created, but navigation failed:\n\n${data.navigationError}`);
                }
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
    const navBtn = (id, label) => (_jsx("button", { type: "button", className: `nav-btn ${view === id ? "active" : ""}`, onClick: () => setView(id), children: label }));
    return (_jsxs("div", { className: "app", children: [_jsxs("div", { className: "sidebar", children: [_jsx("h1", { children: "Web Tester" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Tema visual (Fase 7)" }), _jsx("select", { value: theme, onChange: (e) => setTheme(e.target.value), children: themes.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id))) })] }), _jsxs("nav", { className: "main-nav", children: [navBtn("session", "Sesión"), navBtn("projects", "Proyectos"), navBtn("history", "Historial"), navBtn("bugs", "Bugs"), navBtn("settings", "Ajustes")] }), view === "session" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Target app (opcional)" }), _jsxs("select", { value: targetAppId, onChange: (e) => setTargetAppId(e.target.value), disabled: !!sessionId, children: [_jsx("option", { value: "", children: "\u2014 manual \u2014" }), targetApps.map((a) => (_jsx("option", { value: a.id, children: a.name }, a.id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Target URL" }), _jsx("input", { type: "text", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://private.estarsiempre.com", disabled: !!sessionId })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Device Profile" }), _jsx("select", { value: deviceProfile, onChange: (e) => setDeviceProfile(e.target.value), disabled: !!sessionId, children: Object.entries(DEVICE_PROFILES).map(([key, { name }]) => (_jsx("option", { value: key, children: name }, key))) })] }), !sessionId ? (_jsx("button", { onClick: handleStart, disabled: loading || !url, children: loading ? "Starting..." : "Start Session" })) : (_jsx("button", { onClick: handleStop, className: "stop-btn", children: "Stop Session" })), sessionId && _jsxs("div", { className: "session-info", children: ["Session: ", sessionId] })] }))] }), _jsxs("div", { className: "content", children: [view === "session" && sessionId && (_jsxs(_Fragment, { children: [_jsx("div", { className: "section-label", children: "\uD83D\uDCF9 Live Browser" }), _jsx("div", { className: "browser-section", children: _jsx(Browser, { deviceProfile: deviceProfile, browserLogs: browserLogs, screencastPaused: screencastPaused, subscribeScreencast: subscribeScreencast }) }), _jsx("div", { className: "section-label", children: "\uD83E\uDD16 AI Test" }), _jsx("div", { className: "test-section", children: _jsx(TestRunner, { sessionId: sessionId, agentLogs: agentLogs, onClearAgentLogs: clearAgentLogs }) })] })), view === "session" && !sessionId && (_jsx("p", { className: "empty-hint", children: "Inicia una sesi\u00F3n desde la barra lateral para ver el navegador y ejecutar tests." })), view === "projects" && _jsx(ProjectsPanel, {}), view === "history" && _jsx(HistoryPanel, {}), view === "bugs" && _jsx(BugsPanel, {}), view === "settings" && _jsx(SettingsPanel, {})] })] }));
}
//# sourceMappingURL=App.js.map