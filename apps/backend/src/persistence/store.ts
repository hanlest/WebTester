import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { DeviceProfile } from "@web-tester/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../../../..");

export interface ProjectRow {
  id: string;
  name: string;
  createdAt: number;
}

export interface TargetAppRow {
  id: string;
  projectId: string;
  name: string;
  url: string;
  deviceProfile: DeviceProfile;
  loginUserSelector: string | null;
  loginPassSelector: string | null;
  loginSubmitSelector: string | null;
  createdAt: number;
}

export interface TestCaseRow {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdAt: number;
}

export interface RunRow {
  id: string;
  projectId: string | null;
  sessionId: string;
  testCase: string;
  passed: number;
  reasoning: string;
  startedAt: number;
  durationMs: number;
}

export class AppStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const dataDir = join(rootDir, "data");
    mkdirSync(dataDir, { recursive: true });
    const path = dbPath || join(dataDir, "web-tester.sqlite");
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS target_apps (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        device_profile TEXT NOT NULL,
        login_user_selector TEXT,
        login_pass_selector TEXT,
        login_submit_selector TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        session_id TEXT NOT NULL,
        test_case TEXT NOT NULL,
        passed INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bug_index (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        reviewed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const count = this.db.prepare("SELECT COUNT(*) as c FROM projects").get() as { c: number };
    if (count.c === 0) {
      const id = `proj_default_${Date.now()}`;
      this.db.prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)").run(id, "Estar Siempre QA", Date.now());
    }
  }

  listProjects(): ProjectRow[] {
    return this.db
      .prepare("SELECT id, name, created_at as createdAt FROM projects ORDER BY created_at DESC")
      .all() as ProjectRow[];
  }

  createProject(name: string): ProjectRow {
    const id = `proj_${Date.now()}`;
    const createdAt = Date.now();
    this.db.prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)").run(id, name, createdAt);
    return { id, name, createdAt };
  }

  listTargetApps(projectId: string): TargetAppRow[] {
    return this.db
      .prepare(
        `SELECT id, project_id as projectId, name, url, device_profile as deviceProfile,
         login_user_selector as loginUserSelector, login_pass_selector as loginPassSelector,
         login_submit_selector as loginSubmitSelector, created_at as createdAt
         FROM target_apps WHERE project_id = ? ORDER BY created_at DESC`
      )
      .all(projectId) as TargetAppRow[];
  }

  createTargetApp(input: Omit<TargetAppRow, "id" | "createdAt">): TargetAppRow {
    const id = `app_${Date.now()}`;
    const createdAt = Date.now();
    this.db
      .prepare(
        `INSERT INTO target_apps (id, project_id, name, url, device_profile, login_user_selector, login_pass_selector, login_submit_selector, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.projectId,
        input.name,
        input.url,
        input.deviceProfile,
        input.loginUserSelector,
        input.loginPassSelector,
        input.loginSubmitSelector,
        createdAt
      );
    return { ...input, id, createdAt };
  }

  listTestCases(projectId: string): TestCaseRow[] {
    return this.db
      .prepare("SELECT id, project_id as projectId, title, body, created_at as createdAt FROM test_cases WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId) as TestCaseRow[];
  }

  createTestCase(projectId: string, title: string, body: string): TestCaseRow {
    const id = `tc_${Date.now()}`;
    const createdAt = Date.now();
    this.db.prepare("INSERT INTO test_cases (id, project_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)").run(id, projectId, title, body, createdAt);
    return { id, projectId, title, body, createdAt };
  }

  recordRun(row: RunRow) {
    this.db
      .prepare(
        "INSERT INTO runs (id, project_id, session_id, test_case, passed, reasoning, started_at, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(row.id, row.projectId, row.sessionId, row.testCase, row.passed, row.reasoning, row.startedAt, row.durationMs);
  }

  listRuns(limit = 50): RunRow[] {
    return this.db
      .prepare(
        `SELECT id, project_id as projectId, session_id as sessionId, test_case as testCase,
         passed, reasoning, started_at as startedAt, duration_ms as durationMs
         FROM runs ORDER BY started_at DESC LIMIT ?`
      )
      .all(limit) as RunRow[];
  }

  indexBug(id: string, runId: string | null, severity: string, title: string, createdAt: number) {
    this.db.prepare("INSERT OR REPLACE INTO bug_index (id, run_id, severity, title, reviewed, created_at) VALUES (?, ?, ?, ?, 0, ?)").run(id, runId, severity, title, createdAt);
  }

  listBugIndex() {
    return this.db
      .prepare("SELECT id, run_id as runId, severity, title, reviewed, created_at as createdAt FROM bug_index ORDER BY created_at DESC")
      .all();
  }

  setBugReviewed(id: string, reviewed: boolean) {
    this.db.prepare("UPDATE bug_index SET reviewed = ? WHERE id = ?").run(reviewed ? 1 : 0, id);
  }

  getSetting(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setSetting(key: string, value: string) {
    this.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  }

  exportAll() {
    return {
      projects: this.listProjects(),
      targetApps: this.db.prepare("SELECT * FROM target_apps").all(),
      testCases: this.db.prepare("SELECT * FROM test_cases").all(),
      runs: this.listRuns(500),
      settings: this.db.prepare("SELECT key, value FROM settings").all(),
      exportedAt: Date.now(),
    };
  }

  importAll(data: { projects?: unknown[]; targetApps?: unknown[]; testCases?: unknown[]; settings?: { key: string; value: string }[] }) {
    if (data.projects) {
      for (const p of data.projects as ProjectRow[]) {
        this.db.prepare("INSERT OR REPLACE INTO projects (id, name, created_at) VALUES (?, ?, ?)").run(p.id, p.name, p.createdAt);
      }
    }
    if (data.settings) {
      for (const s of data.settings) {
        this.setSetting(s.key, s.value);
      }
    }
  }
}

export const appStore = new AppStore();
