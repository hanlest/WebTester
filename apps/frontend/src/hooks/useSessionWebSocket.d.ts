import type { AgentLog, LogMessage, ScreencastFrame } from "@web-tester/shared";
export type BrowserLogEntry = LogMessage["payload"];
type ScreencastListener = (frame: ScreencastFrame) => void;
export declare function useSessionWebSocket(sessionId: string | null): {
    browserLogs: {
        level: "info" | "warn" | "error";
        message: string;
        timestamp: number;
    }[];
    agentLogs: AgentLog[];
    screencastPaused: boolean;
    subscribeScreencast: (listener: ScreencastListener) => () => void;
    clearAgentLogs: () => void;
};
export {};
//# sourceMappingURL=useSessionWebSocket.d.ts.map