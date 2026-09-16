export interface ScreencastFrame {
  timestamp: number;
  data: string; // base64 JPEG
  sessionId: string;
}

export interface BrowserSession {
  id: string;
  url: string;
  deviceProfile: "desktop" | "iphone" | "pixel";
  isActive: boolean;
  createdAt: number;
}

export interface AgentLog {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
}

export interface WSMessage {
  type: "screencast" | "screencast_stopped" | "log" | "agent_log" | "error" | "session_created" | "session_closed";
  payload: unknown;
}

export interface ScreencastMessage extends WSMessage {
  type: "screencast";
  payload: ScreencastFrame;
}

export interface LogMessage extends WSMessage {
  type: "log";
  payload: {
    level: "info" | "warn" | "error";
    message: string;
    timestamp: number;
  };
}

export interface AgentLogMessage extends WSMessage {
  type: "agent_log";
  payload: AgentLog;
}

export type DeviceProfile = "desktop" | "iphone" | "pixel";

export type BugSeverity = "low" | "medium" | "high" | "critical";

export type VisualThemeId = "default" | "win311" | "win95" | "win98" | "winxp" | "mac-classic-ii";

export const VISUAL_THEMES: { id: VisualThemeId; name: string }[] = [
  { id: "default", name: "Modern (default)" },
  { id: "win311", name: "Windows 3.11" },
  { id: "win95", name: "Windows 95" },
  { id: "win98", name: "Windows 98" },
  { id: "winxp", name: "Windows XP" },
  { id: "mac-classic-ii", name: "Macintosh Classic II" },
];

export const DEVICE_PROFILES: Record<DeviceProfile, { name: string; viewport: { width: number; height: number }; userAgent?: string }> = {
  desktop: {
    name: "Desktop (1280x720)",
    viewport: { width: 1280, height: 720 },
  },
  iphone: {
    name: "iPhone 13 (390x844)",
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  },
  pixel: {
    name: "Pixel 5 (393x851)",
    viewport: { width: 393, height: 851 },
    userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36",
  },
};
