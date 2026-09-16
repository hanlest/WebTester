import { useEffect, useRef, useState } from "react";
import type { AgentLog } from "@web-tester/shared";
import { BACKEND_URL } from "../config";
import "./TestRunner.css";

const DEFAULT_TEST_CASE = `Revisa el login de esta aplicación.
Usuario: estarsiempre.qa@gmail.com
Clave: QA123456789

El login es exitoso si accedes a la app aunque aparezca un modal informativo (ciérralo si hace falta).`;

interface TestRunnerProps {
  sessionId: string;
  agentLogs: AgentLog[];
  onClearAgentLogs: () => void;
}

export function TestRunner({ sessionId, agentLogs, onClearAgentLogs }: TestRunnerProps) {
  const [testCase, setTestCase] = useState(DEFAULT_TEST_CASE);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; reasoning: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  const handleRunTest = async () => {
    setIsRunning(true);
    onClearAgentLogs();
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/test/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCase }),
      });

      if (!response.ok) {
        const error = await response.json();
        setResult({ passed: false, reasoning: `Error de API: ${error.error}` });
        return;
      }

      const data = await response.json();
      setResult({
        passed: data.passed,
        reasoning: data.reasoning,
      });
    } catch (error) {
      setResult({ passed: false, reasoning: `Error: ${String(error)}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopTest = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/session/${sessionId}/test/stop`, { method: "POST" });
    } catch (error) {
      console.error("Error al detener test:", error);
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
          <button type="button" className="mac-btn-default" onClick={handleRunTest} disabled={isRunning || !testCase}>
            {isRunning ? "Running..." : "Run Test"}
          </button>
          {isRunning && (
            <button type="button" className="stop-test-btn mac-btn-default" onClick={handleStopTest}>
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="test-logs">
        <h3>Agent Activity {isRunning && <span className="live-badge">en vivo</span>}</h3>
        <div className="logs-content">
          {agentLogs.length === 0 && !isRunning && (
            <p className="logs-empty">Ejecuta un test para ver la actividad del agente.</p>
          )}
          {agentLogs.map((log, idx) => (
            <div key={idx} className={`log-entry log-${log.level}`}>
              <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="log-level">[{log.level.toUpperCase()}]</span>
              <span className="log-message">{log.message}</span>
              {log.data !== undefined && <span className="log-data">{String(JSON.stringify(log.data))}</span>}
            </div>
          ))}
          <div ref={logsEndRef} />
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
