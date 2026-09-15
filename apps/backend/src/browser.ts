import { chromium, Browser, Page, CDPSession } from "playwright";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import type { WebSocket } from "ws";

interface SessionData {
  id: string;
  browser: Browser;
  page: Page;
  deviceProfile: DeviceProfile;
  websockets: Set<WebSocket>;
}

export class BrowserManager {
  private sessions = new Map<string, SessionData>();
  private sessionCounter = 0;

  async createSession(url: string, deviceProfile: DeviceProfile): Promise<string> {
    const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
    const profile = DEVICE_PROFILES[deviceProfile];

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
    await page.goto(url, { waitUntil: "load", timeout: 30000 }).catch((e) => {
      console.error("Navigation error:", e);
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      browser,
      page,
      deviceProfile,
      websockets: new Set(),
    });

    return sessionId;
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
    const client = await page.context().newCDPSession(page);

    try {
      await (client as any).send("Page.startScreencast", {
        format: "jpeg",
        quality: 80,
        maxWidth: 1280,
        maxHeight: 720,
      });

      (client as any).on("Page.screencastFrame", async (event: any) => {
        const frameData = event.data;
        ws.send(
          JSON.stringify({
            type: "screencast",
            payload: {
              timestamp: Date.now(),
              data: frameData,
              sessionId,
            },
          })
        );

        await (client as any).send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
      });

      ws.send(JSON.stringify({ type: "log", payload: { level: "info", message: `Screencast started for ${session.deviceProfile}`, timestamp: Date.now() } }));
    } catch (error) {
      console.error("Screencast error:", error);
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
}
