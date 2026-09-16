import type { FastifyInstance } from "fastify";
import { createReadStream } from "fs";
import type { BrowserManager } from "./browser.js";
import { appStore, credentialsService, postgresReadOnly, reportService } from "./services.js";
import type { DeviceProfile } from "@web-tester/shared";

export function registerRoutes(app: FastifyInstance, browserManager: BrowserManager) {
  app.get("/api/projects", async () => appStore.listProjects());

  app.post<{ Body: { name: string } }>("/api/projects", async (request, reply) => {
    const { name } = request.body;
    if (!name?.trim()) return reply.status(400).send({ error: "name is required" });
    return appStore.createProject(name.trim());
  });

  app.get<{ Params: { projectId: string } }>("/api/projects/:projectId/target-apps", async (request) => {
    return appStore.listTargetApps(request.params.projectId);
  });

  app.post<{ Params: { projectId: string }; Body: Record<string, unknown> }>(
    "/api/projects/:projectId/target-apps",
    async (request, reply) => {
      const b = request.body;
      if (!b.name || !b.url) return reply.status(400).send({ error: "name and url required" });
      return appStore.createTargetApp({
        projectId: request.params.projectId,
        name: String(b.name),
        url: String(b.url),
        deviceProfile: (b.deviceProfile as DeviceProfile) || "desktop",
        loginUserSelector: b.loginUserSelector ? String(b.loginUserSelector) : null,
        loginPassSelector: b.loginPassSelector ? String(b.loginPassSelector) : null,
        loginSubmitSelector: b.loginSubmitSelector ? String(b.loginSubmitSelector) : null,
      });
    }
  );

  app.post<{ Params: { targetAppId: string }; Body: { username: string; password: string } }>(
    "/api/target-apps/:targetAppId/credentials",
    async (request, reply) => {
      const { username, password } = request.body;
      if (!username || !password) return reply.status(400).send({ error: "username and password required" });
      credentialsService.saveCredentials(request.params.targetAppId, { username, password });
      return { status: "saved" };
    }
  );

  app.get<{ Params: { targetAppId: string } }>("/api/target-apps/:targetAppId/credentials/status", async (request) => {
    const creds = credentialsService.getCredentials(request.params.targetAppId);
    const storage = credentialsService.getStorageStatePath(request.params.targetAppId);
    return { hasCredentials: !!creds, hasStorageState: !!storage };
  });

  app.post<{ Params: { sessionId: string; targetAppId: string } }>(
    "/api/session/:sessionId/save-storage/:targetAppId",
    async (request, reply) => {
      try {
        await browserManager.saveStorageState(request.params.sessionId, request.params.targetAppId);
        return { status: "saved" };
      } catch (e) {
        return reply.status(400).send({ error: String(e) });
      }
    }
  );

  app.get<{ Params: { projectId: string } }>("/api/projects/:projectId/test-cases", async (request) => {
    return appStore.listTestCases(request.params.projectId);
  });

  app.post<{ Params: { projectId: string }; Body: { title: string; body: string } }>(
    "/api/projects/:projectId/test-cases",
    async (request, reply) => {
      const { title, body } = request.body;
      if (!title || !body) return reply.status(400).send({ error: "title and body required" });
      return appStore.createTestCase(request.params.projectId, title, body);
    }
  );

  app.get("/api/runs", async () => appStore.listRuns());

  app.get("/api/bugs", async () => {
    const fromDisk = reportService.listReports();
    const index = appStore.listBugIndex();
    const reviewedMap = new Map(index.map((b) => [(b as { id: string }).id, (b as { reviewed: number }).reviewed]));
    return fromDisk.map((b) => ({
      ...b,
      reviewed: !!(reviewedMap.get(b.id) ?? (b.reviewed ? 1 : 0)),
    }));
  });

  app.get<{ Params: { id: string } }>("/api/bugs/:id", async (request, reply) => {
    const report = reportService.getReport(request.params.id);
    if (!report) return reply.status(404).send({ error: "Not found" });
    return report;
  });

  app.get<{ Params: { id: string } }>("/api/bugs/:id/screenshot", async (request, reply) => {
    const path = reportService.getScreenshotPath(request.params.id);
    if (!path) return reply.status(404).send({ error: "Not found" });
    return reply.type("image/png").send(createReadStream(path));
  });

  app.patch<{ Params: { id: string }; Body: { reviewed: boolean } }>("/api/bugs/:id", async (request, reply) => {
    try {
      reportService.markReviewed(request.params.id, !!request.body.reviewed);
      appStore.setBugReviewed(request.params.id, !!request.body.reviewed);
      return { status: "ok" };
    } catch (e) {
      return reply.status(404).send({ error: String(e) });
    }
  });

  app.get("/api/settings/database", async () => postgresReadOnly.getStatus());

  app.put<{ Body: { connectionString: string } }>("/api/settings/database", async (request, reply) => {
    const { connectionString } = request.body;
    if (!connectionString) return reply.status(400).send({ error: "connectionString required" });
    try {
      postgresReadOnly.configure(connectionString);
      appStore.setSetting("database_url", connectionString);
      return { status: "configured" };
    } catch (e) {
      return reply.status(400).send({ error: String(e) });
    }
  });

  app.post<{ Body: { sql: string } }>("/api/database/query", async (request, reply) => {
    try {
      return await postgresReadOnly.query(request.body.sql);
    } catch (e) {
      return reply.status(400).send({ error: String(e) });
    }
  });

  app.get("/api/export", async () => appStore.exportAll());

  app.post<{ Body: Record<string, unknown> }>("/api/import", async (request) => {
    appStore.importAll(request.body as Parameters<typeof appStore.importAll>[0]);
    return { status: "imported" };
  });
}
