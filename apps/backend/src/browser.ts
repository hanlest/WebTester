import { chromium, Browser, Page, CDPSession } from "playwright";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import type { WebSocket } from "ws";
import { AgentLoop } from "./agent/loop.js";
import type { ToolExecutorDeps } from "./agent/tool-context.js";
import { AIProvider } from "./ai/index.js";
import type { AgentLog } from "./agent/types.js";
import { PageDiagnostics } from "./capture/page-diagnostics.js";
import { TargetCredentialsService } from "./auth/target-credentials.js";
import { ReportService } from "./reports/service.js";
import { appStore } from "./persistence/store.js";
import { credentialsService as defaultCredentialsService, reportService as defaultReportService } from "./services.js";

interface ScreencastHandle {
  client: CDPSession;
  ws: WebSocket;
  onFrame: (event: { data?: string; sessionId: number }) => Promise<void>;
  healthCheckInterval: ReturnType<typeof setInterval>;
  running: boolean;
  maxWidth: number;
  maxHeight: number;
}

interface SessionData {
  id: string;
  browser: Browser;
  page: Page;
  deviceProfile: DeviceProfile;
  targetAppId?: string;
  projectId?: string;
  diagnostics: PageDiagnostics;
  websockets: Set<WebSocket>;
  screencasts: ScreencastHandle[];
  agentLoop?: AgentLoop;
}

export interface CreateSessionOptions {
  targetAppId?: string;
  projectId?: string;
}

export class BrowserManager {
  private sessions = new Map<string, SessionData>();
  private sessionCounter = 0;

  constructor(
    private reportService: ReportService = defaultReportService,
    private credentialsService: TargetCredentialsService = defaultCredentialsService
  ) {}

  async createSession(
    url: string,
    deviceProfile: DeviceProfile,
    options: CreateSessionOptions = {}
  ): Promise<{ sessionId: string; navigationError?: string }> {
    const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
    const profile = DEVICE_PROFILES[deviceProfile];

    const normalizedUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url) ? url : `https://${url}`;

    const launchOptions = profile.userAgent
      ? {
          headless: true,
          args: [`--user-agent=${profile.userAgent}`],
        }
      : { headless: true };

    const browser = await chromium.launch(launchOptions);

    const storageStatePath = options.targetAppId ? this.credentialsService.getStorageStatePath(options.targetAppId) : undefined;

    const context = await browser.newContext({
      viewport: profile.viewport,
      userAgent: profile.userAgent,
      storageState: storageStatePath || undefined,
    });

    const page = await context.newPage();
    const diagnostics = new PageDiagnostics();
    diagnostics.attach(page);

    let navigationError: string | undefined;
    try {
      await page.goto(normalizedUrl, { waitUntil: "load", timeout: 30000 });
    } catch (e) {
      navigationError = e instanceof Error ? e.message : String(e);
      console.error("Navigation error:", navigationError);
    }

    this.sessions.set(sessionId, {
      id: sessionId,
      browser,
      page,
      deviceProfile,
      targetAppId: options.targetAppId,
      projectId: options.projectId,
      diagnostics,
      websockets: new Set(),
      screencasts: [],
    });

    return { sessionId, navigationError };
  }

  async attachWebSocket(sessionId: string, ws: WebSocket): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.websockets.add(ws);

    await this.startScreencast(session, ws);

    const removeScreencast = () => {
      session.websockets.delete(ws);
      const handle = session.screencasts.find((s) => s.ws === ws);
      if (handle) {
        void this.teardownScreencast(handle);
        session.screencasts = session.screencasts.filter((s) => s.ws !== ws);
      }
    };

    ws.on("close", removeScreencast);

    ws.on("error", (err: Error) => {
      console.error("WebSocket error:", err);
      removeScreencast();
    });
  }

  private sendToWebSocket(ws: WebSocket, message: Record<string, unknown>) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToSession(session: SessionData, message: Record<string, unknown>) {
    for (const ws of session.websockets) {
      this.sendToWebSocket(ws, message);
    }
  }

  private async teardownScreencast(handle: ScreencastHandle): Promise<void> {
    clearInterval(handle.healthCheckInterval);
    handle.client.off("Page.screencastFrame", handle.onFrame);
    if (handle.running) {
      try {
        await handle.client.send("Page.stopScreencast");
      } catch (e) {
        console.error("[Screencast] stopScreencast failed:", e);
      }
      handle.running = false;
    }
  }

  private async startScreencastStream(handle: ScreencastHandle): Promise<void> {
    if (handle.running) return;
    handle.client.on("Page.screencastFrame", handle.onFrame);
    await handle.client.send("Page.startScreencast", {
      format: "jpeg",
      quality: 80,
      maxWidth: handle.maxWidth,
      maxHeight: handle.maxHeight,
    });
    handle.running = true;
  }

  private async stopSessionScreencasts(session: SessionData): Promise<void> {
    for (const handle of session.screencasts) {
      await this.teardownScreencast(handle);
    }
    this.broadcastToSession(session, {
      type: "screencast_stopped",
      payload: { sessionId: session.id, timestamp: Date.now() },
    });
  }

  private async resumeSessionScreencasts(session: SessionData): Promise<void> {
    for (const handle of session.screencasts) {
      try {
        await this.startScreencastStream(handle);
      } catch (e) {
        console.error("[Screencast] Failed to resume:", e);
      }
    }
  }

  private async startScreencast(session: SessionData, ws: WebSocket): Promise<void> {
    const { page, id: sessionId } = session;

    try {
      console.log("[Screencast] Getting CDP session for:", sessionId);
      const client = await page.context().newCDPSession(page);
      console.log("[Screencast] CDP session obtained");

      let frameCount = 0;
      let lastAckTime = Date.now();

      const { width: maxWidth, height: maxHeight } = DEVICE_PROFILES[session.deviceProfile].viewport;

      const onFrame = async (event: { data?: string; sessionId: number }) => {
        frameCount++;
        const now = Date.now();
        const timeSinceLastAck = now - lastAckTime;

        console.log(`[Frame ${frameCount}] received, dataLength=${event.data?.length}, timeSinceLastAck=${timeSinceLastAck}ms`);

        if (!event.data) {
          console.error("[Frame] No data in event:", event);
          return;
        }

        try {
          this.sendToWebSocket(ws, {
            type: "screencast",
            payload: {
              timestamp: now,
              data: event.data,
              sessionId,
            },
          });
        } catch (e) {
          console.error("[Frame] Failed to send to WebSocket:", e);
        }

        try {
          await client.send("Page.screencastFrameAck", { sessionId: event.sessionId });
          lastAckTime = Date.now();
          console.log(`[Frame ${frameCount}] ACK sent`);
        } catch (e) {
          console.error(`[Frame ${frameCount}] Failed to send ACK:`, e);
        }
      };

      const healthCheckInterval = setInterval(() => {
        if (ws.readyState !== 1) {
          console.log("[Screencast] WebSocket closed, stopping screencast");
          const handle = session.screencasts.find((s) => s.ws === ws);
          if (handle) {
            void this.teardownScreencast(handle);
            session.screencasts = session.screencasts.filter((s) => s.ws !== ws);
          }
        }
      }, 5000);

      const handle: ScreencastHandle = {
        client,
        ws,
        onFrame,
        healthCheckInterval,
        running: false,
        maxWidth,
        maxHeight,
      };

      session.screencasts.push(handle);

      console.log("[Screencast] Calling startScreencast...", { maxWidth, maxHeight });
      await this.startScreencastStream(handle);

      console.log("[Screencast] startScreencast completed successfully");
      this.sendToWebSocket(ws, {
        type: "log",
        payload: { level: "info", message: `Screencast started for ${session.deviceProfile}`, timestamp: Date.now() },
      });
    } catch (error) {
      console.error("[Screencast] Fatal error:", error);
      this.sendToWebSocket(ws, { type: "error", payload: { message: String(error) } });
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    for (const handle of session.screencasts) {
      await this.teardownScreencast(handle);
    }
    session.screencasts = [];

    for (const ws of session.websockets) {
      ws.send(JSON.stringify({ type: "log", payload: { level: "info", message: "Session closing", timestamp: Date.now() } }));
      ws.close();
    }

    await session.browser.close();
    this.sessions.delete(sessionId);
  }

  async saveStorageState(sessionId: string, targetAppId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    const state = await session.page.context().storageState();
    this.credentialsService.saveStorageState(targetAppId, state);
  }

  async executeTest(
    sessionId: string,
    testCase: string,
    aiProvider: AIProvider
  ): Promise<{ runId: string; passed: boolean; reasoning: string; logs: AgentLog[]; duration: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`[Test] Starting test for session ${sessionId}`);

    const runId = `run_${Date.now()}`;
    const startedAt = Date.now();

    const toolDeps: ToolExecutorDeps = {
      sessionId,
      runId,
      page: session.page,
      diagnostics: session.diagnostics,
      reportService: this.reportService,
    };

    const agentLoop = new AgentLoop(aiProvider, session.page, (log: AgentLog) => {
      // Broadcast agent logs to all connected WebSockets
      for (const ws of session.websockets) {
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "agent_log",
              payload: log,
            })
          );
        }
      }
    }, toolDeps);

    session.agentLoop = agentLoop;

    await this.resumeSessionScreencasts(session);

    let result;
    try {
      result = await agentLoop.executeTest(testCase);
    } finally {
      session.agentLoop = undefined;
      await this.stopSessionScreencasts(session);
    }

    appStore.recordRun({
      id: runId,
      projectId: session.projectId ?? null,
      sessionId,
      testCase,
      passed: result.passed ? 1 : 0,
      reasoning: result.reasoning,
      startedAt,
      durationMs: result.duration,
    });

    if (result.passed && session.targetAppId) {
      try {
        await this.saveStorageState(sessionId, session.targetAppId);
      } catch (e) {
        console.error("Failed to persist storage state after successful test:", e);
      }
    }

    return {
      runId,
      passed: result.passed,
      reasoning: result.reasoning,
      logs: result.logs,
      duration: result.duration,
    };
  }

  stopTest(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (!session.agentLoop) {
      throw new Error(`No test is currently running for session ${sessionId}`);
    }
    session.agentLoop.stop();
  }
}
