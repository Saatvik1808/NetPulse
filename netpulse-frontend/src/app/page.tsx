"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBrowserAgent } from "@/hooks/useBrowserAgent";
import { MeasurementData, COORDINATES, isRegionResolved } from "@/lib/api";
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

  // Global Config Sync
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${backendUrl}/api/v1/config`);
        if (res.ok) {
          const config = await res.json();
          setBrowserAgentEnabled(config.browserPinging);
          setBrowserAgentInterval(config.browserIntervalMs);
        }
      } catch (err) {
        console.warn("Failed to sync global config", err);
      }
    };
    fetchConfig();
    const syncInterval = setInterval(fetchConfig, 10000); // Sync every 10s
    return () => clearInterval(syncInterval);
  }, []);

  const updateGlobalConfig = async (pinging: boolean, intervalMs: number) => {
    // Optimistic UI update
    setBrowserAgentEnabled(pinging);
    setBrowserAgentInterval(intervalMs);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${backendUrl}/api/v1/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browserPinging: pinging, browserIntervalMs: intervalMs }),
      });
    } catch (err) {
      console.error("Failed to update global config", err);
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [existingTargets, setExistingTargets] = useState<any[]>([]);
  
  // Terminal tracking
  const [totalPackets, setTotalPackets] = useState(0);

  // Fetch targets globally to keep 'ACTIVE TARGETS' count accurate
  const fetchTargets = useCallback(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${backendUrl}/api/v1/targets`)
      .then(res => res.json())
      .then(data => setExistingTargets(data))
      .catch(err => console.error("Fetch targets error:", err));
  }, []);

  useEffect(() => {
    fetchTargets(); // Initial fetch
    const targetsInterval = setInterval(fetchTargets, 15000); // Sync every 15s
    return () => clearInterval(targetsInterval);
  }, [fetchTargets]);

  // Re-fetch immediately when modal opens to ensure fresh data
  useEffect(() => {
    if (modalOpen) {
      fetchTargets();
    }
  }, [modalOpen, fetchTargets]);

  // Lazy Geocoding for unknown regions
  useEffect(() => {
    const resolvePending = async () => {
      const allRegions = new Set<string>();
      existingTargets.forEach(t => { if (t.region) allRegions.add(t.region); });
      measurements.forEach(m => {
        if (m.sourceRegion) allRegions.add(m.sourceRegion);
        if (m.targetRegion) allRegions.add(m.targetRegion);
      });

      for (const region of allRegions) {
        if (!region || region === "unknown" || region === "global" || region === "local") continue;
        if (!isRegionResolved(region)) {
           try {
              const city = region.split(",")[0].trim();
              const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
              if (res.ok) {
                 const data = await res.json();
                 if (data.results && data.results.length > 0) {
                    COORDINATES[region] = [data.results[0].latitude, data.results[0].longitude];
                    // Trigger a tiny state update to force re-render arcs with new real coordinates
                    setMeasurements(prev => [...prev]); 
                 } else {
                    COORDINATES[region] = [0, 0]; // Mark as resolved (failed)
                 }
              }
           } catch {
              console.warn("Geocoding failed for", region);
           }
        }
      }
    };
    resolvePending();
  }, [existingTargets, measurements, setMeasurements]);

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
  const uniqueTargets = existingTargets.filter((t) => t.active !== false).length;

  return (
    <div className="app">
      {/* 3D Globe — fills viewport */}
      <div className="globe-container" onContextMenuCapture={(e) => e.stopPropagation()}>
        <GlobeMap 
          measurements={measurements} 
          selectedTarget={selectedTarget} 
          onSelectNode={setSelectedTarget}
        />
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
            <span className="tech-metric-val" style={{ color: (browserAgentEnabled && browserAgent.pinging && browserAgent.city) ? "var(--accent-green)" : "var(--text-muted)" }}>
              {browserAgentEnabled && browserAgent.pinging ? `ACTIVE (${browserAgent.city})` : "INACTIVE"}
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
                 onClick={() => updateGlobalConfig(!browserAgentEnabled, browserAgentInterval)}
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
                onChange={(e) => updateGlobalConfig(browserAgentEnabled, Number(e.target.value))}
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
              <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <h4 style={{ margin: "0 0 1.25rem 0", color: "var(--accent-blue)", fontSize: "0.9rem", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span> ADD NEW ENDPOINT
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end" }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: "2 1 200px" }}>
                    <label className="form-group__label">Host / IP</label>
                    <input
                      className="form-group__input"
                      placeholder="e.g. cloudflare.com"
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px" }}>
                    <label className="form-group__label">Region</label>
                    <input
                      className="form-group__input"
                      placeholder="e.g. global"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn--primary"
                    style={{ height: "42px", flex: "0 0 120px", justifyContent: "center", fontWeight: "600", letterSpacing: "0.5px" }}
                    onClick={async () => {
                      if (!newHost.trim()) return;
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                      
                      let finalRegion = newRegion.trim();
                      if (!finalRegion) {
                        try {
                          // Clean host for IP API (remove protocol/paths)
                          let cleanHost = newHost.trim().replace(/^https?:\/\//, '').split('/')[0];
                          const ipRes = await fetch(`https://ipapi.co/${cleanHost}/json/`);
                          if (ipRes.ok) {
                            const data = await ipRes.json();
                            if (data.city && data.country_name) {
                              finalRegion = `${data.city}, ${data.country_name}`;
                            } else if (data.country_name) {
                              finalRegion = data.country_name;
                            }
                          }
                        } catch (e) {
                          console.warn("Could not auto-resolve region", e);
                        }
                      }
                      
                      try {
                        const response = await fetch(`${backendUrl}/api/v1/targets`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            host: newHost.trim(),
                            url: newHost.startsWith("http") ? newHost.trim() : `https://${newHost.trim()}`,
                            region: finalRegion || "global"
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
                        style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "6px" }}
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
