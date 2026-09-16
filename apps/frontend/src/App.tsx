import { useState } from "react";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import { Browser } from "./components/Browser";
import { TestRunner } from "./components/TestRunner";
import { BACKEND_URL } from "./config";
import "./App.css";

export function App() {
  const [url, setUrl] = useState("https://example.com");
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, deviceProfile }),
      });

      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      } else {
        alert("Failed to start session");
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${BACKEND_URL}/api/session/${sessionId}/stop`, { method: "POST" });
      setSessionId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h1>Web Tester</h1>

        <div className="form-group">
          <label>Target URL</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" disabled={!!sessionId} />
        </div>

        <div className="form-group">
          <label>Device Profile</label>
          <select value={deviceProfile} onChange={(e) => setDeviceProfile(e.target.value as DeviceProfile)} disabled={!!sessionId}>
            {Object.entries(DEVICE_PROFILES).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {!sessionId ? (
          <button onClick={handleStart} disabled={loading || !url}>
            {loading ? "Starting..." : "Start Session"}
          </button>
        ) : (
          <button onClick={handleStop} className="stop-btn">
            Stop Session
          </button>
        )}

        {sessionId && <div className="session-info">Session: {sessionId}</div>}
      </div>

      <div className="content">
        {sessionId && (
          <>
            <div className="section-label">📹 Live Browser</div>
            <div className="browser-section">
              <Browser sessionId={sessionId} />
            </div>

            <div className="section-label">🤖 AI Test</div>
            <div className="test-section">
              <TestRunner sessionId={sessionId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
