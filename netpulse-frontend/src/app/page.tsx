"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBrowserAgent } from "@/hooks/useBrowserAgent";
import { MeasurementData } from "@/lib/api";
import "./globals.css";

// 3D Globe — client-side only
const GlobeMap = dynamic(() => import("@/components/Map/GlobeMap"), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="loading__spinner" />
      <div className="loading__text">Loading 3D Globe...</div>
    </div>
  ),
});

function latencyColor(ms: number): string {
  if (ms <= 0) return "var(--accent-red)";
  if (ms < 20) return "var(--accent-green)";
  if (ms < 50) return "#84cc16";
  if (ms < 100) return "var(--accent-yellow)";
  if (ms < 200) return "var(--accent-orange)";
  return "var(--accent-red)";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export default function Home() {
  const { measurements, setMeasurements, loading, error } = useMeasurements(0);
  
  const [browserAgentEnabled, setBrowserAgentEnabled] = useState(true);
  const [browserAgentInterval, setBrowserAgentInterval] = useState(5000);
  const browserAgent = useBrowserAgent(browserAgentEnabled, browserAgentInterval);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [existingTargets, setExistingTargets] = useState<any[]>([]);
  
  // Terminal tracking
  const [totalPackets, setTotalPackets] = useState(0);

  // Fetch targets when modal opens
  useEffect(() => {
    if (modalOpen) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      fetch(`${backendUrl}/api/v1/targets`)
        .then(res => res.json())
        .then(data => setExistingTargets(data))
        .catch(err => console.error("Fetch targets error:", err));
    }
  }, [modalOpen]);

  // WebSocket live updates
  const handleNewMeasurement = useCallback(
    (m: MeasurementData) => {
      setTotalPackets((prev) => prev + 1);
      setMeasurements((prev: MeasurementData[]) => [m, ...prev].slice(0, 100)); // Keep more history for terminal
    },
    [setMeasurements]
  );
  const { connected } = useWebSocket(handleNewMeasurement);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner" />
        <div className="loading__text">Connecting to NetPulse...</div>
      </div>
    );
  }

  // Stats
  const success = measurements.filter((m) => m.status === "SUCCESS");
  const avg = success.length > 0
    ? success.reduce((s, m) => s + m.latencyMs, 0) / success.length : 0;
  const min = success.length > 0
    ? Math.min(...success.map((m) => m.latencyMs)) : 0;
  const max = success.length > 0
    ? Math.max(...success.map((m) => m.latencyMs)) : 0;
  const uniqueTargets = new Set(measurements.map((m) => m.targetHost)).size;

  return (
    <div className="app">
      {/* 3D Globe — fills viewport */}
      <div className="globe-container" onContextMenuCapture={(e) => e.stopPropagation()}>
        <GlobeMap measurements={measurements} selectedTarget={selectedTarget} />
      </div>

      {/* Floating Header */}
      <header className="header">
        <div className="header__brand">
          <span className="header__logo">NetPulse</span>
          <span className="header__subtitle">Global Latency Monitor</span>
        </div>
        <div className="header__actions">
          <div className="header__status">
            <span className={`header__dot ${!connected ? "header__dot--connecting" : ""}`} />
            <span>
              {connected
                ? "Live"
                : error
                ? "Disconnected"
                : "Connecting..."}
            </span>
          </div>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            + Add Target
          </button>
          <button className="btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "✕ Close" : "☰ Dashboard"}
          </button>
        </div>
      </header>

      {/* Floating Stats Pills (bottom left) */}
      <div className="float-stats">
        <div className="float-pill">
          Targets: <span className="float-pill__value" style={{ color: "var(--accent-purple)" }}>{uniqueTargets}</span>
        </div>
        <div className="float-pill">
          Probes: <span className="float-pill__value" style={{ color: "var(--accent-blue)" }}>{measurements.length}</span>
        </div>
        <div className="float-pill">
          Avg: <span className="float-pill__value" style={{ color: "var(--accent-green)" }}>{avg.toFixed(1)} ms</span>
        </div>
      </div>

      {/* Collapsible Sidebar (Technical Dashboard) */}
      <aside className={`sidebar ${!sidebarOpen ? "sidebar--hidden" : ""}`}>
        <div className="sidebar__header">
          <span className="sidebar__title">SYSTEM OPS DASHBOARD</span>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {/* Global Overview Grid */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-card__label">GLOBAL AVG LATENCY</div>
            <div className="stat-card__value stat-card__value--green">
              {avg.toFixed(1)}<span className="stat-card__unit">ms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">ACTIVE TARGETS</div>
            <div className="stat-card__value stat-card__value--purple">
              {uniqueTargets}
            </div>
          </div>
        </div>

        {/* Technical Metrics Panel */}
        <div className="tech-metrics">
          <div className="tech-metric-row">
            <span className="tech-metric-key">PROTOCOL:</span>
            <span className="tech-metric-val">TCP/HTTP</span>
          </div>
          <div className="tech-metric-row">
            <span className="tech-metric-key">BROWSER_AGENT:</span>
            <span className="tech-metric-val" style={{ color: browserAgent.city ? "var(--accent-green)" : "var(--text-muted)" }}>
              {browserAgent.city ? `ACTIVE (${browserAgent.city})` : "INITIATING..."}
            </span>
          </div>
          <div className="tech-metric-row">
            <span className="tech-metric-key">PACKETS_RX:</span>
            <span className="tech-metric-val" style={{ color: "var(--accent-blue)" }}>{measurements.length + totalPackets}</span>
          </div>
          <div className="tech-metric-row">
            <span className="tech-metric-key">ACTIVE_NODES:</span>
            <span className="tech-metric-val" style={{ color: "var(--accent-green)" }}>{Array.from(new Set(measurements.map(m => m.sourceRegion))).length}</span>
          </div>
          <div className="tech-metric-row">
            <span className="tech-metric-key" style={{ lineHeight: "18px" }}>AGENT_POWER:</span>
            <span className="tech-metric-val">
               <button 
                 onClick={() => setBrowserAgentEnabled(!browserAgentEnabled)}
                 style={{ background: browserAgentEnabled ? 'var(--accent-green)' : 'var(--text-muted)', color: '#000', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                 {browserAgentEnabled ? 'ON' : 'OFF'}
               </button>
            </span>
          </div>
          <div className="tech-metric-row">
            <span className="tech-metric-key" style={{ lineHeight: "22px" }}>POLL_FREQ:</span>
            <span className="tech-metric-val">
              <select 
                value={browserAgentInterval} 
                onChange={(e) => setBrowserAgentInterval(Number(e.target.value))}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', padding: '2px 4px', cursor: 'pointer' }}
              >
                <option value={2000}>2000ms</option>
                <option value={5000}>5000ms</option>
                <option value={10000}>10000ms</option>
                <option value={30000}>30000ms</option>
                <option value={60000}>60000ms</option>
              </select>
            </span>
          </div>
        </div>

        {/* Live Terminal Feed */}
        <div className="sidebar__header" style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}>
          <span className="sidebar__title">TERMINAL I/O</span>
          {selectedTarget && (
            <button
              className="sidebar__close"
              onClick={() => setSelectedTarget(null)}
              title="Clear filter"
            >✕</button>
          )}
        </div>
        <div className="terminal-log">
          {measurements.slice(0, 40).map((m) => (
            <div
              key={m.id}
              className={`terminal-line ${selectedTarget === m.targetHost ? "terminal-line--selected" : ""}`}
              onClick={() => setSelectedTarget(selectedTarget === m.targetHost ? null : m.targetHost)}
            >
              <span className="term-time">[{new Date(m.createdAt).toISOString().split('T')[1].slice(0,-1)}]</span>
              <span className="term-src">{m.sourceRegion}</span>
              <span className="term-arrow">&gt;</span>
              <span className="term-tgt">{m.targetHost}</span>
              <span className="term-status" style={{ color: latencyColor(m.latencyMs) }}>
                {m.status === "SUCCESS" ? `${m.latencyMs.toFixed(1)}ms` : "TIMEOUT"}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Target Manager Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">🎯 Target Manager</span>
              <button className="sidebar__close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal__body">
              {/* Add New Target Section */}
              <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 1rem 0", color: "var(--accent-blue)", fontSize: "0.9rem", letterSpacing: "0.05em" }}>ADD NEW ENDPOINT</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "1rem", alignItems: "end" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-group__label">Host / IP</label>
                    <input
                      className="form-group__input"
                      placeholder="cloudflare.com"
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-group__label">Region</label>
                    <input
                      className="form-group__input"
                      placeholder="global"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn--primary"
                    style={{ height: "42px" }}
                    onClick={async () => {
                      if (!newHost.trim()) return;
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                      try {
                        const response = await fetch(`${backendUrl}/api/v1/targets`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            host: newHost.trim(),
                            url: newHost.startsWith("http") ? newHost.trim() : `https://${newHost.trim()}`,
                            region: newRegion.trim() || "unknown"
                          })
                        });
                        if (response.ok) {
                          setNewHost("");
                          setNewRegion("");
                          // Refresh target list
                          const tr = await fetch(`${backendUrl}/api/v1/targets`);
                          if (tr.ok) setExistingTargets(await tr.json());
                        }
                      } catch (err) { console.error(err); }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Targets List */}
              <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-secondary)", fontSize: "0.9rem", letterSpacing: "0.05em" }}>ACTIVE TARGETS</h4>
              <div className="target-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {existingTargets.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                    No custom targets found.
                  </div>
                ) : (
                  existingTargets.map((t: any) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{t.host}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.region} • {t.url}</div>
                      </div>
                      <button
                        className="btn btn--danger"
                        style={{ padding: "4px 12px", fontSize: "11px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" }}
                        onClick={async () => {
                          if (!confirm(`Stop monitoring ${t.host}?`)) return;
                          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                          try {
                            const res = await fetch(`${backendUrl}/api/v1/targets/${t.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setExistingTargets(existingTargets.filter((item: any) => item.id !== t.id));
                            }
                          } catch (err) { console.error(err); }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
