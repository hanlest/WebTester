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
import { MacScreenMenuBar } from "./components/MacScreenMenuBar";
import { Win95Taskbar } from "./components/Win95Taskbar";
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
  const isMacClassic = theme === "mac-classic-ii";
  const isWin95 = theme === "win95";
  const isRetroShell = theme === "win311" || isMacClassic || isWin95;

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
      <label title="Selecciona el tema visual retro o moderno de toda la interfaz de Web Tester.">
        {isRetroShell ? "Tema visual" : "Tema visual (Fase 7)"}
      </label>
      <Win311Combo
        value={theme}
        onChange={(e) => setTheme(e.target.value as typeof theme)}
        title="Cambia entre temas como Windows 95, Program Manager 3.11, Mac Classic II o el aspecto predeterminado."
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Win311Combo>
    </div>
  );

  const navigation = isRetroShell ? (
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
          <label title="Aplicación objetivo guardada en un proyecto; al elegirla se rellenan URL y proyecto automáticamente.">
            Target app (opcional)
          </label>
          <Win311Combo
            value={targetAppId}
            onChange={(e) => setTargetAppId(e.target.value)}
            disabled={!!sessionId}
            title="Lista de apps configuradas en Proyectos. Elige una o deja «manual» para escribir la URL tú mismo."
          >
            <option value="">— manual —</option>
            {targetApps.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Win311Combo>
        </div>

        <div className="form-group">
          <label title="Dirección web que el navegador remoto cargará al iniciar la sesión de prueba.">
            Target URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://private.estarsiempre.com"
            disabled={!!sessionId}
            title="URL completa (https://…) del sitio o entorno que quieres probar en esta sesión."
          />
        </div>

        <div className="form-group">
          <label title="Simula el tamaño de pantalla y capacidades del dispositivo del usuario final.">
            Device Profile
          </label>
          <Win311Combo
            value={deviceProfile}
            onChange={(e) => setDeviceProfile(e.target.value as DeviceProfile)}
            disabled={!!sessionId}
            title="Perfil de viewport y dispositivo: escritorio, tablet o móvil, según los presets del proyecto."
          >
            {Object.entries(DEVICE_PROFILES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Win311Combo>
        </div>

        {!sessionId ? (
          <button
            type="button"
            className="mac-btn-default"
            onClick={handleStart}
            disabled={loading || !url}
            title="Crea una sesión en el backend, abre el navegador remoto en la URL indicada y habilita pruebas con IA."
          >
            {loading ? "Starting..." : "Start Session"}
          </button>
        ) : (
          <button
            type="button"
            className="stop-btn mac-btn-default"
            onClick={handleStop}
            title="Cierra la sesión activa, detiene el navegador remoto y libera los recursos del servidor."
          >
            Stop Session
          </button>
        )}

        {sessionId && (
          <div
            className="session-info"
            title="Identificador único de la sesión actual; úsalo para depuración o correlación con logs del servidor."
          >
            Session: {sessionId}
          </div>
        )}
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
        <p
          className="empty-hint"
          title="Sin sesión activa: usa la barra lateral para configurar la URL y pulsar Start Session."
        >
          Inicia una sesión desde la barra lateral para ver el navegador y ejecutar tests.
        </p>
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

  const sidebarWindowTitle = isMacClassic || isWin95 ? "Web Tester" : "Program Manager";
  const contentWindowTitle = isWin95
    ? `Exploring - ${WIN311_VIEW_TITLES[view]}`
    : WIN311_VIEW_TITLES[view];
  const windows = (
    <>
      <Win311Window title={sidebarWindowTitle} className="retro-sidebar">
        {sidebarBody}
      </Win311Window>
      <Win311Window title={contentWindowTitle} className="retro-content">
        <div className="content-inner">{mainContent}</div>
      </Win311Window>
    </>
  );

  const appShell = (
    <div className="app">
      {isMacClassic ? <MacScreenMenuBar /> : null}
      {isRetroShell ? (
        <div className={isMacClassic ? "mac-app-windows" : "retro-app-windows"}>{windows}</div>
      ) : (
        <>
          <div className="sidebar">
            <h1>Web Tester</h1>
            {sidebarBody}
          </div>
          <div className="content">{mainContent}</div>
        </>
      )}
    </div>
  );

  if (isMacClassic) {
    return (
      <div className="mac-page-frame">
        <div className="mac-page-surface">{appShell}</div>
      </div>
    );
  }

  if (isWin95) {
    const taskLabel = contentWindowTitle.length > 28
      ? `${contentWindowTitle.slice(0, 25)}...`
      : contentWindowTitle;
    return (
      <div className="win95-desktop">
        {appShell}
        <Win95Taskbar
          tasks={[
            { id: "sidebar", label: sidebarWindowTitle },
            { id: "content", label: taskLabel, pressed: true },
          ]}
        />
      </div>
    );
  }

  return appShell;
}
