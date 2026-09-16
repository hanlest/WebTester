import { useState } from "react";
import { BACKEND_URL } from "../config";
import "./TestRunner.css";

interface TestRunnerProps {
  sessionId: string;
}

interface AgentLog {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: Record<string, unknown> | string | number | boolean | null;
}

export function TestRunner({ sessionId }: TestRunnerProps) {
  const [testCase, setTestCase] = useState("Navigate to https://example.com and verify the page loads");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; reasoning: string } | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);

  const handleRunTest = async () => {
    setIsRunning(true);
    setLogs([]);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/test/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCase }),
      });

      if (!response.ok) {
        const error = await response.json();
        setLogs((prev) => [
          ...prev,
          {
            timestamp: Date.now(),
            level: "error",
            message: `API Error: ${error.error}`,
          },
        ]);
        setIsRunning(false);
        return;
      }

      const data = await response.json();
      setResult({
        passed: data.passed,
        reasoning: data.reasoning,
      });

      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          level: "error",
          message: `Error: ${String(error)}`,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopTest = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/session/${sessionId}/test/stop`, { method: "POST" });
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          level: "error",
          message: `Error al detener: ${String(error)}`,
        },
      ]);
    }
  };

  return (
    <div className="test-runner">
      <div className="test-editor">
        <h3>Test Case</h3>
        <textarea
          value={testCase}
          onChange={(e) => setTestCase(e.target.value)}
          disabled={isRunning}
          placeholder="Describe your test case in natural language..."
        />
        <div className="test-actions">
          <button onClick={handleRunTest} disabled={isRunning || !testCase}>
            {isRunning ? "Running..." : "Run Test"}
          </button>
          {isRunning && (
            <button onClick={handleStopTest} className="stop-test-btn">
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="test-logs">
        <h3>Agent Activity</h3>
        <div className="logs-content">
          {logs.map((log, idx) => (
            <div key={idx} className={`log-entry log-${log.level}`}>
              <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="log-level">[{log.level.toUpperCase()}]</span>
              <span className="log-message">{log.message}</span>
              {log.data && <span className="log-data">{String(JSON.stringify(log.data))}</span>}
            </div>
          ))}
        </div>
      </div>

      {result && (
        <div className={`test-result ${result.passed ? "passed" : "failed"}`}>
          <h3>Test Result: {result.passed ? "✅ PASSED" : "❌ FAILED"}</h3>
          <p>{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}
