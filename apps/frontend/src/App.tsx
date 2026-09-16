import { useEffect, useState } from "react";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import { Browser } from "./components/Browser";
import { TestRunner } from "./components/TestRunner";
import { BugsPanel, HistoryPanel, ProjectsPanel, SettingsPanel } from "./components/AdminPanels";
import { useVisualTheme } from "./context/VisualThemeContext";
import { useSessionWebSocket } from "./hooks/useSessionWebSocket";
import { apiGet } from "./api/client";
import { Win311Nav } from "./components/Win311Nav";
import { Win311Combo } from "./components/Win311Combo";
import { Win311Window } from "./components/Win311Window";
import { WIN311_VIEW_TITLES } from "./app-view-titles";
import { BACKEND_URL } from "./config";
import type { AppView } from "./app-types";
import "./App.css";

interface TargetAppOption {
  id: string;
  name: string;
  url: string;
  projectId: string;
}

export function App() {
  const { theme, setTheme, themes } = useVisualTheme();
  const [view, setView] = useState<AppView>("session");
  const [url, setUrl] = useState("https://private.estarsiempre.com");
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetApps, setTargetApps] = useState<TargetAppOption[]>([]);
  const [targetAppId, setTargetAppId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  const { browserLogs, agentLogs, screencastPaused, subscribeScreencast, clearAgentLogs } = useSessionWebSocket(sessionId);
  const isWin311 = theme === "win311";

  useEffect(() => {
    void (async () => {
      try {
        const projects = await apiGet<{ id: string; name: string }[]>("/api/projects");
        const apps: TargetAppOption[] = [];
        for (const p of projects) {
          const list = await apiGet<{ id: string; name: string; url: string; projectId: string }[]>(
            `/api/projects/${p.id}/target-apps`
          );
          apps.push(...list.map((a) => ({ ...a, projectId: p.id })));
        }
        setTargetApps(apps);
        if (projects[0]) setProjectId(projects[0].id);
      } catch {
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
      } else {
        alert("Failed to start session");
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${BACKEND_URL}/api/session/${sessionId}/stop`, { method: "POST" });
      setSessionId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const navBtn = (id: AppView, label: string) => (
    <button type="button" className={`nav-btn ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
      {label}
    </button>
  );

  const themeSelector = (
    <div className="form-group">
      <label>{isWin311 ? "Tema visual" : "Tema visual (Fase 7)"}</label>
      <Win311Combo value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Win311Combo>
    </div>
  );

  const navigation = isWin311 ? (
    <Win311Nav view={view} onSelect={setView} />
  ) : (
    <nav className="main-nav">
      {navBtn("session", "Sesión")}
      {navBtn("projects", "Proyectos")}
      {navBtn("history", "Historial")}
      {navBtn("bugs", "Bugs")}
      {navBtn("settings", "Ajustes")}
    </nav>
  );

  const sessionControls =
    view === "session" ? (
      <>
        <div className="form-group">
          <label>Target app (opcional)</label>
          <Win311Combo value={targetAppId} onChange={(e) => setTargetAppId(e.target.value)} disabled={!!sessionId}>
            <option value="">— manual —</option>
            {targetApps.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Win311Combo>
        </div>

        <div className="form-group">
          <label>Target URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://private.estarsiempre.com"
            disabled={!!sessionId}
          />
        </div>

        <div className="form-group">
          <label>Device Profile</label>
          <Win311Combo
            value={deviceProfile}
            onChange={(e) => setDeviceProfile(e.target.value as DeviceProfile)}
            disabled={!!sessionId}
          >
            {Object.entries(DEVICE_PROFILES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Win311Combo>
        </div>

        {!sessionId ? (
          <button onClick={handleStart} disabled={loading || !url}>
            {loading ? "Starting..." : "Start Session"}
          </button>
        ) : (
          <button onClick={handleStop} className="stop-btn">Stop Session</button>
        )}

        {sessionId && <div className="session-info">Session: {sessionId}</div>}
      </>
    ) : null;

  const mainContent = (
    <>
      {view === "session" && sessionId && (
        <>
          <div className="section-label">Live Browser</div>
          <div className="browser-section">
            <Browser
              deviceProfile={deviceProfile}
              browserLogs={browserLogs}
              screencastPaused={screencastPaused}
              subscribeScreencast={subscribeScreencast}
            />
          </div>
          <div className="section-label">AI Test</div>
          <div className="test-section">
            <TestRunner sessionId={sessionId} agentLogs={agentLogs} onClearAgentLogs={clearAgentLogs} />
          </div>
        </>
      )}

      {view === "session" && !sessionId && (
        <p className="empty-hint">Inicia una sesión desde la barra lateral para ver el navegador y ejecutar tests.</p>
      )}

      {view === "projects" && <ProjectsPanel />}
      {view === "history" && <HistoryPanel />}
      {view === "bugs" && <BugsPanel />}
      {view === "settings" && <SettingsPanel />}
    </>
  );

  const sidebarBody = (
    <>
      {themeSelector}
      {navigation}
      {sessionControls}
    </>
  );

  return (
    <div className="app">
      {isWin311 ? (
        <Win311Window title="Program Manager" className="win311-sidebar">
          {sidebarBody}
        </Win311Window>
      ) : (
        <div className="sidebar">
          <h1>Web Tester</h1>
          {sidebarBody}
        </div>
      )}

      {isWin311 ? (
        <Win311Window title={WIN311_VIEW_TITLES[view]} className="win311-content">
          <div className="content-inner">{mainContent}</div>
        </Win311Window>
      ) : (
        <div className="content">{mainContent}</div>
      )}
    </div>
  );
}
