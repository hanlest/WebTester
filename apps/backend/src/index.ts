import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../../..");

config({ path: join(rootDir, ".env") });
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { BrowserManager } from "./browser.js";
import { createAIProvider } from "./ai/index.js";
import { registerRoutes } from "./routes.js";
import { appStore, postgresReadOnly } from "./services.js";

const app = Fastify({ logger: true });
const browserManager = new BrowserManager();
let aiProvider: ReturnType<typeof createAIProvider> | null = null;

try {
  aiProvider = createAIProvider();
  console.log(`✅ AI Provider initialized: ${process.env.AI_PROVIDER || "anthropic"}`);
} catch (error) {
  console.error("❌ Failed to initialize AI Provider:", error);
}

await app.register(cors, {
  origin: true,
  credentials: true,
});
await app.register(websocket);

const savedDbUrl = appStore.getSetting("database_url");
if (savedDbUrl) {
  postgresReadOnly.configure(savedDbUrl);
}

registerRoutes(app, browserManager);

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/config", async () => {
  return {
    aiProvider: process.env.AI_PROVIDER || "anthropic",
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    backendPort: process.env.BACKEND_PORT || 3001,
  };
});

app.post<{
  Body: { url: string; deviceProfile: "desktop" | "iphone" | "pixel"; targetAppId?: string; projectId?: string };
}>("/api/session/start", async (request, reply) => {
  const { url, deviceProfile, targetAppId, projectId } = request.body;

  if (!url) {
    return reply.status(400).send({ error: "URL is required" });
  }

  try {
    const { sessionId, navigationError } = await browserManager.createSession(url, deviceProfile || "desktop", {
      targetAppId,
      projectId,
    });
    return { sessionId, status: "created", navigationError };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: "Failed to create session" });
  }
});

app.post<{ Params: { sessionId: string } }>("/api/session/:sessionId/stop", async (request, reply) => {
  const { sessionId } = request.params;

  try {
    await browserManager.closeSession(sessionId);
    return { status: "closed" };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: "Failed to close session" });
  }
});

app.post<{ Params: { sessionId: string }; Body: { testCase: string } }>("/api/session/:sessionId/test/execute", async (request, reply) => {
  const { sessionId } = request.params;
  const { testCase } = request.body;

  if (!aiProvider) {
    return reply.status(500).send({ error: "AI Provider not initialized" });
  }

  if (!testCase) {
    return reply.status(400).send({ error: "testCase is required" });
  }

  try {
    const result = await browserManager.executeTest(sessionId, testCase, aiProvider);
    return { testId: `test_${Date.now()}`, ...result };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: String(error) });
  }
});

app.post<{ Params: { sessionId: string } }>("/api/session/:sessionId/test/stop", async (request, reply) => {
  const { sessionId } = request.params;

  try {
    browserManager.stopTest(sessionId);
    return { status: "stopping" };
  } catch (error) {
    app.log.error(error);
    return reply.status(400).send({ error: String(error) });
  }
});

app.get("/ws/session/:sessionId", { websocket: true }, async (socket, request) => {
  const { sessionId } = request.params as { sessionId: string };

  try {
    await browserManager.attachWebSocket(sessionId, socket);
  } catch (error) {
    app.log.error(error);
    socket.send(JSON.stringify({ type: "error", payload: { message: String(error) } }));
    socket.close();
  }
});

const start = async () => {
  const port = Number(process.env.BACKEND_PORT) || 3001;
  const host = process.env.BACKEND_HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
