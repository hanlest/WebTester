import { useState } from "react";
import { DEVICE_PROFILES, DeviceProfile } from "@web-tester/shared";
import { Browser } from "./components/Browser";
import { TestRunner } from "./components/TestRunner";
import "./App.css";

type Tab = "browser" | "test";

export function App() {
  const [url, setUrl] = useState("https://example.com");
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("browser");

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/session/start", {
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
      await fetch(`http://localhost:3001/api/session/${sessionId}/stop`, { method: "POST" });
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
            <div className="tabs">
              <button className={`tab ${activeTab === "browser" ? "active" : ""}`} onClick={() => setActiveTab("browser")}>
                📹 Live Browser
              </button>
              <button className={`tab ${activeTab === "test" ? "active" : ""}`} onClick={() => setActiveTab("test")}>
                🤖 AI Test
              </button>
            </div>

            {activeTab === "browser" && <Browser sessionId={sessionId} />}
            {activeTab === "test" && <TestRunner sessionId={sessionId} />}
          </>
        )}
      </div>
    </div>
  );
}
