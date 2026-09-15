import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { BrowserManager } from "./browser.js";

const app = Fastify({ logger: true });
const browserManager = new BrowserManager();

await app.register(cors);
await app.register(websocket);

app.get("/health", async () => {
  return { status: "ok" };
});

app.post<{ Body: { url: string; deviceProfile: "desktop" | "iphone" | "pixel" } }>("/api/session/start", async (request, reply) => {
  const { url, deviceProfile } = request.body;

  if (!url) {
    return reply.status(400).send({ error: "URL is required" });
  }

  try {
    const sessionId = await browserManager.createSession(url, deviceProfile || "desktop");
    return { sessionId, status: "created" };
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
  try {
    await app.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3001");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
