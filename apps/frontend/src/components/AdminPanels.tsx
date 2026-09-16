import { useEffect, useState } from "react";
import type { DeviceProfile } from "@web-tester/shared";
import { apiGet, apiPatch, apiPost, apiPut } from "../api/client";
import { BACKEND_URL } from "../config";
import "./AdminPanels.css";

interface Project {
  id: string;
  name: string;
}

interface TargetApp {
  id: string;
  name: string;
  url: string;
  deviceProfile: DeviceProfile;
}

interface RunRow {
  id: string;
  sessionId: string;
  testCase: string;
  passed: number;
  reasoning: string;
  startedAt: number;
  durationMs: number;
}

interface BugRow {
  id: string;
  title: string;
  severity: string;
  reviewed: boolean;
  createdAt: number;
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [apps, setApps] = useState<TargetApp[]>([]);
  const [newProject, setNewProject] = useState("");
  const [credUser, setCredUser] = useState("");
  const [credPass, setCredPass] = useState("");
  const [selectedApp, setSelectedApp] = useState("");

  const load = async () => {
    const p = await apiGet<Project[]>("/api/projects");
    setProjects(p);
    if (!selected && p[0]) setSelected(p[0].id);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    void apiGet<TargetApp[]>(`/api/projects/${selected}/target-apps`).then(setApps);
  }, [selected]);

  const addProject = async () => {
    if (!newProject.trim()) return;
    await apiPost("/api/projects", { name: newProject.trim() });
    setNewProject("");
    await load();
  };

  const addApp = async () => {
    await apiPost(`/api/projects/${selected}/target-apps`, {
      name: "Estar Siempre Private",
      url: "https://private.estarsiempre.com",
      deviceProfile: "desktop",
      loginUserSelector: 'input[type="email"]',
      loginPassSelector: 'input[type="password"]',
    });
    setApps(await apiGet(`/api/projects/${selected}/target-apps`));
  };

  const saveCreds = async () => {
    if (!selectedApp) return;
    await apiPost(`/api/target-apps/${selectedApp}/credentials`, { username: credUser, password: credPass });
    alert("Credenciales guardadas (cifradas en .secrets/)");
  };

  return (
    <div className="admin-panel">
      <h2>Proyectos y apps</h2>
      <div className="row">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input placeholder="Nuevo proyecto" value={newProject} onChange={(e) => setNewProject(e.target.value)} />
        <button type="button" onClick={addProject}>Crear</button>
      </div>
      <button type="button" onClick={addApp}>Añadir app target (Estar Siempre)</button>
      <ul className="simple-list">
        {apps.map((a) => (
          <li key={a.id}>
            <button type="button" className="linkish" onClick={() => setSelectedApp(a.id)}>
              {a.name}
            </button> — {a.url}
          </li>
        ))}
      </ul>
      {selectedApp && (
        <div className="cred-box">
          <h3>Credenciales (Fase 4)</h3>
          <input placeholder="Usuario" value={credUser} onChange={(e) => setCredUser(e.target.value)} />
          <input placeholder="Clave" type="password" value={credPass} onChange={(e) => setCredPass(e.target.value)} />
          <button type="button" onClick={saveCreds}>Guardar cifrado</button>
        </div>
      )}
    </div>
  );
}

export function HistoryPanel() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  useEffect(() => {
    void apiGet<RunRow[]>("/api/runs").then(setRuns);
  }, []);
  return (
    <div className="admin-panel">
      <h2>Historial de ejecuciones</h2>
      <ul className="simple-list">
        {runs.map((r) => (
          <li key={r.id} className={r.passed ? "pass" : "fail"}>
            <strong>{r.passed ? "PASS" : "FAIL"}</strong> — {new Date(r.startedAt).toLocaleString()} ({r.durationMs}ms)
            <div className="muted">{r.testCase.slice(0, 120)}…</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BugsPanel() {
  const [bugs, setBugs] = useState<BugRow[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const load = () => void apiGet<BugRow[]>("/api/bugs").then(setBugs);

  useEffect(() => {
    load();
  }, []);

  const open = async (id: string) => {
    setDetail(await apiGet(`/api/bugs/${id}`));
  };

  const toggleReviewed = async (id: string, reviewed: boolean) => {
    await apiPatch(`/api/bugs/${id}`, { reviewed });
    load();
  };

  return (
    <div className="admin-panel bugs-panel">
      <h2>Reportes de bugs (Fase 3)</h2>
      <div className="bugs-layout">
        <ul className="simple-list">
          {bugs.map((b) => (
            <li key={b.id}>
              <button type="button" className="linkish" onClick={() => open(b.id)}>
                [{b.severity}] {b.title}
              </button>
              {b.reviewed ? " ✓" : ""}
            </li>
          ))}
        </ul>
        {detail && (
          <div className="bug-detail">
            <h3>{String(detail.title)}</h3>
            <p>{String(detail.description)}</p>
            <img src={`${BACKEND_URL}/api/bugs/${detail.id}/screenshot`} alt="screenshot" />
            <pre>{String(detail.markdown || "").slice(0, 2000)}</pre>
            <button type="button" onClick={() => toggleReviewed(String(detail.id), true)}>Marcar revisado</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [dbUrl, setDbUrl] = useState("");
  const [dbStatus, setDbStatus] = useState<{ configured: boolean } | null>(null);

  useEffect(() => {
    void apiGet<{ configured: boolean }>("/api/settings/database").then(setDbStatus);
  }, []);

  const saveDb = async () => {
    await apiPut("/api/settings/database", { connectionString: dbUrl });
    setDbStatus(await apiGet("/api/settings/database"));
    alert("Postgres configurado (solo SELECT)");
  };

  const exportData = async () => {
    const data = await apiGet("/api/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `web-tester-export-${Date.now()}.json`;
    a.click();
  };

  const importData = async (file: File) => {
    const text = await file.text();
    await apiPost("/api/import", JSON.parse(text));
    alert("Importación completada");
  };

  return (
    <div className="admin-panel">
      <h2>Ajustes</h2>
      <p className="muted">Base de datos Postgres (Fase 5) — solo lectura para el agente.</p>
      <input
        placeholder="postgresql://user:pass@localhost:5432/db"
        value={dbUrl}
        onChange={(e) => setDbUrl(e.target.value)}
        style={{ width: "100%" }}
      />
      <button type="button" onClick={saveDb}>Guardar conexión</button>
      <p>Estado: {dbStatus?.configured ? "configurado" : "no configurado"}</p>
      <hr />
      <h3>Export / Import (Fase 6)</h3>
      <button type="button" onClick={exportData}>Exportar JSON</button>
      <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
    </div>
  );
}
