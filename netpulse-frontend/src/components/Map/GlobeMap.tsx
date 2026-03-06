"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MeasurementData, TracerouteHop, COORDINATES, getCoordinates } from "@/lib/api";

import * as THREE from 'three';

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobeMapProps {
  measurements: MeasurementData[];
  selectedTarget: string | null;
  onSelectNode?: (target: string | null) => void;
  showHeatmap?: boolean;
  tracerouteHops?: TracerouteHop[];
}

// Neon color palette — vivid, saturated, glowing
function latencyColor(ms: number): [string, string] {
  // Returns [startColor, endColor] for gradient arcs
  if (ms <= 0) return ["#ff1744", "#ff5252"];        // neon red
  if (ms < 20) return ["#00e676", "#69f0ae"];        // neon green
  if (ms < 50) return ["#76ff03", "#b2ff59"];        // neon lime
  if (ms < 100) return ["#ffea00", "#ffff00"];       // neon yellow
  if (ms < 200) return ["#ff9100", "#ffab40"];       // neon orange
  return ["#ff1744", "#ff5252"];                      // neon red
}

function latencySingleColor(ms: number): string {
  if (ms <= 0) return "#ff1744";
  if (ms < 20) return "#00e676";
  if (ms < 50) return "#76ff03";
  if (ms < 100) return "#ffea00";
  if (ms < 200) return "#ff9100";
  return "#ff1744";
}

export default function GlobeMap({ measurements, selectedTarget, onSelectNode, showHeatmap = false, tracerouteHops = [] }: GlobeMapProps) {
  const globeRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [globeReady, setGlobeReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hopCoords, setHopCoords] = useState<Record<string, [number, number]>>({});

  // Initial camera position (run once)
  useEffect(() => {
    if (globeRef.current && globeReady) {
      const controls = globeRef.current.controls();
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 500;
      controls.autoRotateSpeed = 0.3;

      // Point camera at India only on initial load
      globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 1500);
    }
  }, [globeReady]);

  // Handle pause/play rotation independently based on hover state
  useEffect(() => {
    if (globeRef.current && globeReady) {
       const controls = globeRef.current.controls();
       controls.autoRotate = !isHovered;
    }
  }, [isHovered, globeReady]);

  // Build arcs from measurements
  const arcsData = useMemo(() => {
    const latestByPair = new Map<string, MeasurementData>();
    measurements.forEach((m) => {
      const key = `${m.sourceRegion}-${m.targetRegion || m.targetHost}`;
      const existing = latestByPair.get(key);
      if (!existing || m.measuredAt > existing.measuredAt) {
        latestByPair.set(key, m);
      }
    });

    return Array.from(latestByPair.values())
      .filter((m) => {
        const src = getCoordinates(m.sourceRegion);
        const tgtKey = m.targetRegion || m.targetHost;
        const tgt = getCoordinates(tgtKey);
        return src && tgt;
      })
      .map((m) => {
        const isPointSelected = !selectedTarget || m.targetHost === selectedTarget || m.sourceRegion === selectedTarget;
        const src = getCoordinates(m.sourceRegion);
        const tgtKey = m.targetRegion || m.targetHost;
        const tgt = getCoordinates(tgtKey);
        const [startColor, endColor] = latencyColor(m.latencyMs);
        const targetKey = m.targetRegion || m.targetHost;
        const isSelected = !selectedTarget || m.targetHost === selectedTarget;
        return {
          startLat: src[0],
          startLng: src[1],
          endLat: tgt[0],
          endLng: tgt[1],
          startColor: isSelected ? startColor : startColor + "25",
          endColor: isSelected ? endColor : endColor + "25",
          targetKey,
          targetHost: m.targetHost,
          latencyMs: m.latencyMs,
          strokeWidth: isSelected ? (selectedTarget ? 0.8 : 0.3) : 0.1,
          label: `<div style="
            font-family: 'JetBrains Mono', monospace;
            background: rgba(5, 8, 22, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid ${startColor}40;
            border-radius: 8px;
            padding: 8px 12px;
            box-shadow: 0 0 20px ${startColor}30;
            font-size: 12px;
            color: #f1f5f9;
          ">
            <div style="margin-bottom: 4px; font-weight: 600;">
              ${m.sourceRegion} <span style="color: ${startColor};">→</span> ${m.targetHost}
            </div>
            <div style="color: ${startColor}; font-size: 14px; font-weight: 700;">
              ${m.status === "SUCCESS" ? m.latencyMs.toFixed(1) + " ms" : "TIMEOUT"}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Loss: ${(m.packetLoss * 100).toFixed(0)}%
            </div>
          </div>`,
          status: m.status,
        };
      });
  }, [measurements, selectedTarget]);

  // Build points
  const pointsData = useMemo(() => {
    const points = new Map<
      string,
      { lat: number; lng: number; label: string; isSource: boolean; latencyMs: number; isPointSelected: boolean; targetKey: string }
    >();
    
    // Calculate aggregate stats for in-depth details
    const statsInfo = new Map<string, { count: number; totalLatency: number; lossCount: number; status: string }>();
    measurements.forEach(m => {
      const key = m.targetRegion || m.targetHost;
      if (!statsInfo.has(key)) statsInfo.set(key, { count: 0, totalLatency: 0, lossCount: 0, status: "" });
      const stat = statsInfo.get(key)!;
      stat.count++;
      if (m.status === "SUCCESS") {
        stat.totalLatency += m.latencyMs;
        stat.status = "SUCCESS";
      } else {
        stat.lossCount++;
      }
    });

    measurements.forEach((m) => {
      const src = getCoordinates(m.sourceRegion);
      if (src && !points.has(m.sourceRegion)) {
        const srcSelected = !selectedTarget;
        points.set(m.sourceRegion, {
          lat: src[0],
          lng: src[1],
          isPointSelected: srcSelected,
          targetKey: m.sourceRegion,
          label: `<div style="
            font-family: 'Inter', sans-serif;
            background: rgba(5, 8, 22, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid #3b82f660;
            border-radius: 8px;
            padding: 10px 14px;
            color: #f1f5f9;
            box-shadow: 0 0 20px #3b82f630;
          ">
            <div style="font-weight: 700; color: #60a5fa; font-size: 14px; margin-bottom: 2px;">${m.sourceRegion}</div>
            <div style="font-size: 11px; color: #94a3b8;">Local Agent Node</div>
          </div>`,
          isSource: true,
          latencyMs: 0,
        });
      }
      const tgtKey = m.targetRegion || m.targetHost;
      const tgt = getCoordinates(tgtKey);
      if (tgt && !points.has(tgtKey)) {
        const color = latencySingleColor(m.latencyMs);
        const tgtSelected = !selectedTarget || m.targetHost === selectedTarget;
        const stat = statsInfo.get(tgtKey)!;
        const avgLat = stat.count - stat.lossCount > 0 ? (stat.totalLatency / (stat.count - stat.lossCount)).toFixed(1) : 0;
        const lossPer = ((stat.lossCount / stat.count) * 100).toFixed(0);
        
        points.set(tgtKey, {
          lat: tgt[0],
          lng: tgt[1],
          isPointSelected: tgtSelected,
          targetKey: m.targetHost,
          label: `<div style="
            font-family: 'JetBrains Mono', monospace;
            background: rgba(5, 8, 22, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid ${color}60;
            border-radius: 8px;
            padding: 12px 16px;
            color: #f1f5f9;
            box-shadow: 0 0 25px ${color}40;
            min-width: 140px;
          ">
            <div style="font-weight: 700; font-size: 14px; color: ${color}; margin-bottom: 4px;">${m.targetHost}</div>
            <div style="font-size: 12px; color: #94a3b8; font-family: 'Inter', sans-serif; margin-bottom: 8px;">${tgtKey}</div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 8px; font-size: 12px;">
              <span style="color: #94a3b8;">Avg Latency</span>
              <span style="font-weight: 600;">${avgLat} ms</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px;">
              <span style="color: #94a3b8;">Packet Loss</span>
              <span style="font-weight: 600; color: ${Number(lossPer) > 0 ? '#ff1744' : '#f1f5f9'};">${lossPer}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px;">
              <span style="color: #94a3b8;">Total Probes</span>
              <span style="font-weight: 600;">${stat.count}</span>
            </div>
          </div>`,
          isSource: false,
          latencyMs: m.latencyMs,
        });
      }
    });

    return Array.from(points.values());
  }, [measurements, selectedTarget]);

  // Source points for rings
  const ringsData = useMemo(
    () => pointsData.filter((p) => p.isSource),
    [pointsData]
  );

  // Build heatmap data from measurements
  const heatmapData = useMemo(() => {
    if (!showHeatmap) return [];
    
    const heatPoints: { lat: number; lng: number; weight: number }[] = [];
    measurements.forEach((m) => {
      const tgtKey = m.targetRegion || m.targetHost;
      const coords = getCoordinates(tgtKey);
      if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
        // Weight: higher latency = higher weight (hotter color)
        const weight = Math.min(m.latencyMs / 500, 1); // normalize to [0, 1] with 500ms as max
        heatPoints.push({ lat: coords[0], lng: coords[1], weight: Math.max(weight, 0.05) });
      }
      // Also add source regions with a small base weight
      const srcCoords = getCoordinates(m.sourceRegion);
      if (srcCoords && (srcCoords[0] !== 0 || srcCoords[1] !== 0)) {
        heatPoints.push({ lat: srcCoords[0], lng: srcCoords[1], weight: 0.1 });
      }
    });
    return [heatPoints];
  }, [measurements, showHeatmap]);

  // Geocode traceroute hop IPs
  useEffect(() => {
    if (tracerouteHops.length === 0) { setHopCoords({}); return; }
    const unknownIps = tracerouteHops
      .filter(h => !h.timedOut && h.hopIp !== '*' && !hopCoords[h.hopIp])
      .map(h => h.hopIp);
    if (unknownIps.length === 0) return;

    // Batch geocode via ip-api.com (free, up to 15 per minute)
    const unique = [...new Set(unknownIps)].slice(0, 10);
    Promise.all(unique.map(ip =>
      fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,status`)
        .then(r => r.json())
        .catch(() => null)
    )).then(results => {
      const newCoords: Record<string, [number, number]> = { ...hopCoords };
      results.forEach((r, i) => {
        if (r && r.status === 'success') {
          newCoords[unique[i]] = [r.lat, r.lon];
        }
      });
      setHopCoords(newCoords);
    });
  }, [tracerouteHops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build traceroute arcs and points
  const tracerouteArcs = useMemo(() => {
    if (tracerouteHops.length === 0) return [];
    const arcs: any[] = [];
    const hopsWithCoords = tracerouteHops
      .filter(h => !h.timedOut && hopCoords[h.hopIp])
      .sort((a, b) => a.hopNumber - b.hopNumber);

    for (let i = 0; i < hopsWithCoords.length - 1; i++) {
      const from = hopCoords[hopsWithCoords[i].hopIp];
      const to = hopCoords[hopsWithCoords[i + 1].hopIp];
      if (from && to) {
        arcs.push({
          startLat: from[0], startLng: from[1],
          endLat: to[0], endLng: to[1],
          startColor: '#00e5ff', endColor: '#00b8d4',
          strokeWidth: 0.6,
          label: `<div style="font-family:'JetBrains Mono',monospace;background:rgba(0,229,255,0.15);border:1px solid #00e5ff40;border-radius:6px;padding:8px 12px;color:#e0f7fa;font-size:11px;">Hop ${hopsWithCoords[i].hopNumber} → ${hopsWithCoords[i + 1].hopNumber}<br/>${hopsWithCoords[i].hopIp} → ${hopsWithCoords[i + 1].hopIp}<br/>RTT: ${hopsWithCoords[i + 1].hopRttMs.toFixed(1)} ms</div>`,
          isTraceroute: true,
        });
      }
    }
    return arcs;
  }, [tracerouteHops, hopCoords]);

  const traceroutePoints = useMemo(() => {
    if (tracerouteHops.length === 0) return [];
    return tracerouteHops
      .filter(h => !h.timedOut && hopCoords[h.hopIp])
      .map(h => ({
        lat: hopCoords[h.hopIp][0],
        lng: hopCoords[h.hopIp][1],
        isSource: false,
        isPointSelected: true,
        isTracerouteHop: true,
        targetKey: h.hopIp,
        label: `<div style="font-family:'JetBrains Mono',monospace;background:rgba(0,229,255,0.12);border:1px solid #00e5ff50;border-radius:6px;padding:8px 12px;color:#e0f7fa;font-size:11px;">Hop #${h.hopNumber}<br/>IP: ${h.hopIp}<br/>RTT: ${h.hopRttMs.toFixed(1)} ms</div>`,
        latencyMs: h.hopRttMs,
      }));
  }, [tracerouteHops, hopCoords]);

  // Merge all arcs and points
  const allArcs = useMemo(() => [...arcsData, ...tracerouteArcs], [arcsData, tracerouteArcs]);
  const allPoints = useMemo(() => [...pointsData, ...traceroutePoints], [pointsData, traceroutePoints]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#050816" }}>
      <Globe
        ref={globeRef}
        onGlobeReady={() => {
          setGlobeReady(true);
          // Add clouds layer directly to THIS globe's scene
          const globe = globeRef.current;
          if (globe) {
            const CLOUDS_IMG_URL = '//unpkg.com/three-globe/example/img/earth-clouds.png';
            const CLOUDS_ALT = 0.004;
            const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

            new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture: any) => {
              const clouds = new THREE.Mesh(
                new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
                new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true, opacity: 0.8 })
              );
              globe.scene().add(clouds);

              (function rotateClouds() {
                clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
                requestAnimationFrame(rotateClouds);
              })();
            });

            // ── Dynamic 3D Starfield ──
            const starGeometry = new THREE.BufferGeometry();
            const starMaterial = new THREE.PointsMaterial({
              color: 0xffffff,
              size: 2.0,
              transparent: true,
              opacity: 0.9,
              sizeAttenuation: true
            });
            const starVertices = [];
            for (let i = 0; i < 6000; i++) {
              const x = (Math.random() - 0.5) * 3000;
              const y = (Math.random() - 0.5) * 3000;
              const z = (Math.random() - 0.5) * 3000;
              // Keep stars outside the immediate globe vicinity
              if (Math.abs(x) < 300 && Math.abs(y) < 300 && Math.abs(z) < 300) continue;
              starVertices.push(x, y, z);
            }
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const stars = new THREE.Points(starGeometry, starMaterial);
            globe.scene().add(stars);

            (function animateStars() {
              stars.rotation.y += 0.0003;
              stars.rotation.z += 0.0001;
              requestAnimationFrame(animateStars);
            })();
          }

        }}
        
        // ── HD Realistic Textures ──
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}

        // ── Neon Arcs ──
        arcsData={allArcs}
        arcColor={(d: any) => [(d as any).startColor, (d as any).endColor]} 
        arcDashLength={(d: any) => (d as any).isTraceroute ? 0.15 : 0.3}
        arcDashGap={(d: any) => (d as any).isTraceroute ? 0.5 : 2}
        arcDashInitialGap={() => Math.random() * 2}
        arcDashAnimateTime={(d: any) => (d as any).isTraceroute ? 800 : 1500}
        arcStroke={(d: any) => (d as any).strokeWidth} 
        arcLabel="label"
        arcAltitudeAutoScale={(d: any) => (d as any).isTraceroute ? 0.2 : 0.5}

        // ── Glowing Points ──
        pointsData={allPoints}
        pointColor={(d: any) => { 
          const p = d as any; 
          if (p.isTracerouteHop) return "#00e5ff";
          if (!p.isPointSelected) return "#ffffff10";
          return p.isSource ? "#00b0ff" : "#f43f5e";
        }}
        pointAltitude={(d: any) => (d as any).isTracerouteHop ? 0.025 : 0.015}
        pointRadius={(d: any) => {
          const p = d as any;
          if (p.isTracerouteHop) return 0.4;
          return p.isPointSelected ? 0.6 : 0.3;
        }} 
        pointLabel="label"
        pointsMerge={false}
        onPointHover={(point: any) => setIsHovered(!!point)}
        onPointClick={(point: any) => {
          if (onSelectNode && point && !point.isSource) {
             onSelectNode(point.targetKey === selectedTarget ? null : point.targetKey);
          }
        }}
        onArcHover={(arc: any) => setIsHovered(!!arc)}
        onArcClick={(arc: any) => {
          if (onSelectNode && arc) {
             onSelectNode(arc.targetHost === selectedTarget ? null : arc.targetHost);
          }
        }}

        // ── Pulse Rings at agents ──
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(0, 176, 255, ${(1 - t) * 0.8})`}
        ringMaxRadius={4}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1200}

        // ── HTML Labels for key points ──
        htmlElementsData={pointsData}
        htmlLat={(d: any) => (d as any).lat} 
        htmlLng={(d: any) => (d as any).lng} 
        htmlAltitude={0.04}
        htmlElement={(d: any) => { 
          const el = document.createElement("div");
          const data = d as any; 
          const isSource = data.isSource;
          const color = isSource ? "#00b0ff" : "#f43f5e";
          el.innerHTML = `<div style="
            width: 8px; height: 8px;
            background: ${color};
            border-radius: 50%;
            box-shadow: 0 0 10px ${color}, 0 0 20px ${color}80, 0 0 30px ${color}40;
            animation: neonPulse 2s ease-in-out infinite alternate;
          "></div>`;
          el.style.cssText = "pointer-events: none;";
          return el;
        }}
        // ── Live Latency Heatmap ──
        heatmapsData={heatmapData}
        heatmapPointLat="lat"
        heatmapPointLng="lng"
        heatmapPointWeight="weight"
        heatmapTopAltitude={0.01}
        heatmapBandwidth={3.5}
        heatmapColorSaturation={2.8}
      />

      <style jsx global>{`
        @keyframes neonPulse {
          from { opacity: 0.5; transform: scale(1); }
          to { opacity: 1; transform: scale(2.2); }
        }
      `}</style>
    </div>
  );
}
