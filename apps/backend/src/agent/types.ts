export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentLog {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  reasoning: string;
  logs: AgentLog[];
  duration: number;
}
