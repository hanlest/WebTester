import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentLog, LogMessage, ScreencastFrame } from "@web-tester/shared";
import { BACKEND_WS_URL } from "../config";

export type BrowserLogEntry = LogMessage["payload"];

type ScreencastListener = (frame: ScreencastFrame) => void;

export function useSessionWebSocket(sessionId: string | null) {
  const [browserLogs, setBrowserLogs] = useState<BrowserLogEntry[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [screencastPaused, setScreencastPaused] = useState(false);
  const screencastListenersRef = useRef(new Set<ScreencastListener>());

  const subscribeScreencast = useCallback((listener: ScreencastListener) => {
    screencastListenersRef.current.add(listener);
    return () => {
      screencastListenersRef.current.delete(listener);
    };
  }, []);

  const clearAgentLogs = useCallback(() => {
    setAgentLogs([]);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setBrowserLogs([]);
      setAgentLogs([]);
      setScreencastPaused(false);
      return;
    }

    const ws = new WebSocket(`${BACKEND_WS_URL}/ws/session/${sessionId}`);

    ws.onopen = () => {
      setBrowserLogs((prev) => [...prev, { level: "info", message: "WebSocket connected", timestamp: Date.now() }]);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "screencast_stopped") {
          setScreencastPaused(true);
          setBrowserLogs((prev) => [
            ...prev,
            { level: "info", message: "Vista en pausa (test finalizado)", timestamp: Date.now() },
          ]);
        } else if (msg.type === "screencast") {
          setScreencastPaused(false);
          const frame = msg.payload as ScreencastFrame;
          for (const listener of screencastListenersRef.current) {
            listener(frame);
          }
        } else if (msg.type === "log") {
          setBrowserLogs((prev) => [...prev, msg.payload as BrowserLogEntry]);
        } else if (msg.type === "agent_log") {
          setAgentLogs((prev) => [...prev, msg.payload as AgentLog]);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = () => {
      setBrowserLogs((prev) => [...prev, { level: "error", message: "WebSocket error", timestamp: Date.now() }]);
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return {
    browserLogs,
    agentLogs,
    screencastPaused,
    subscribeScreencast,
    clearAgentLogs,
  };
}
