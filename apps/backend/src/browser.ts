import { chromium, Browser, Page, CDPSession } from "playwright";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import type { WebSocket } from "ws";
import { AgentLoop } from "./agent/loop.js";
import { AIProvider } from "./ai/index.js";
import type { AgentLog } from "./agent/types.js";

interface SessionData {
  id: string;
  browser: Browser;
  page: Page;
  deviceProfile: DeviceProfile;
  websockets: Set<WebSocket>;
  agentLoop?: AgentLoop;
}

export class BrowserManager {
  private sessions = new Map<string, SessionData>();
  private sessionCounter = 0;

  async createSession(url: string, deviceProfile: DeviceProfile): Promise<{ sessionId: string; navigationError?: string }> {
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
    const context = await browser.newContext({
      viewport: profile.viewport,
      userAgent: profile.userAgent,
    });

    const page = await context.newPage();

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
      websockets: new Set(),
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

    ws.on("close", () => {
      session.websockets.delete(ws);
    });

    ws.on("error", (err: Error) => {
      console.error("WebSocket error:", err);
      session.websockets.delete(ws);
    });
  }

  private async startScreencast(session: SessionData, ws: WebSocket): Promise<void> {
    const { page, id: sessionId } = session;

    try {
      console.log("[Screencast] Getting CDP session for:", sessionId);
      const client = await page.context().newCDPSession(page);
      console.log("[Screencast] CDP session obtained");

      let frameCount = 0;
      let lastAckTime = Date.now();

      // Set up listener with error handling
      const onFrame = async (event: any) => {
        frameCount++;
        const now = Date.now();
        const timeSinceLastAck = now - lastAckTime;

        console.log(`[Frame ${frameCount}] received, dataLength=${event.data?.length}, timeSinceLastAck=${timeSinceLastAck}ms`);

        if (!event.data) {
          console.error("[Frame] No data in event:", event);
          return;
        }

        try {
          ws.send(
            JSON.stringify({
              type: "screencast",
              payload: {
                timestamp: now,
                data: event.data,
                sessionId,
              },
            })
          );
        } catch (e) {
          console.error("[Frame] Failed to send to WebSocket:", e);
        }

        // Send ACK
        try {
          await (client as any).send("Page.screencastFrameAck", { sessionId: event.sessionId });
          lastAckTime = Date.now();
          console.log(`[Frame ${frameCount}] ACK sent`);
        } catch (e) {
          console.error(`[Frame ${frameCount}] Failed to send ACK:`, e);
        }
      };

      (client as any).on("Page.screencastFrame", onFrame);
      console.log("[Screencast] Frame listener registered");

      // Start screencast
      console.log("[Screencast] Calling startScreencast...");
      await (client as any).send("Page.startScreencast", {
        format: "jpeg",
        quality: 80,
        maxWidth: 1280,
        maxHeight: 720,
      });

      console.log("[Screencast] startScreencast completed successfully");
      ws.send(JSON.stringify({ type: "log", payload: { level: "info", message: `Screencast started for ${session.deviceProfile}`, timestamp: Date.now() } }));

      // Keep the session alive by checking periodically
      const healthCheckInterval = setInterval(() => {
        if (ws.readyState !== 1) { // WebSocket.OPEN
          console.log("[Screencast] WebSocket closed, stopping screencast");
          clearInterval(healthCheckInterval);
          (client as any).off("Page.screencastFrame", onFrame);
        }
      }, 5000);

    } catch (error) {
      console.error("[Screencast] Fatal error:", error);
      ws.send(JSON.stringify({ type: "error", payload: { message: String(error) } }));
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    for (const ws of session.websockets) {
      ws.send(JSON.stringify({ type: "log", payload: { level: "info", message: "Session closing", timestamp: Date.now() } }));
      ws.close();
    }

    await session.browser.close();
    this.sessions.delete(sessionId);
  }

  async executeTest(sessionId: string, testCase: string, aiProvider: AIProvider): Promise<{ passed: boolean; reasoning: string; logs: AgentLog[] }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`[Test] Starting test for session ${sessionId}`);

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
    });

    session.agentLoop = agentLoop;

    const result = await agentLoop.executeTest(testCase);

    return {
      passed: result.passed,
      reasoning: result.reasoning,
      logs: result.logs,
    };
  }
}
