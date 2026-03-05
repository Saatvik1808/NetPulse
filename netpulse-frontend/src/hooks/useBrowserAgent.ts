"use client";

import { useEffect, useRef, useState } from "react";
import { COORDINATES } from "../lib/api";

interface TargetInfo {
    host: string;
    url: string;
    region: string;
}

const FALLBACK_TARGETS: TargetInfo[] = [
    { host: "dns.google", url: "https://dns.google", region: "global" },
    { host: "cloudflare", url: "https://1.1.1.1", region: "global" },
];

export function useBrowserAgent(enabled: boolean = true, intervalMs: number = 5000) {
    const [browserAgentState, setBrowserAgentState] = useState<{
        city: string | null;
        pinging: boolean;
        sourceRegion?: string;
    }>({ city: null, pinging: false });

    const isRunningRef = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const startAgent = async () => {
            if (!enabled) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setBrowserAgentState(prev => ({ ...prev, pinging: false }));
                return;
            }

            const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

            // 1. Get user location (only once)
            let city = browserAgentState.city;
            let sourceRegionLocal = "Unknown Region";
            if (!city) {
                try {
                    const res = await fetch("https://ipapi.co/json/");
                    const data = await res.json();
                    if (data.city) city = data.city;
                    const country = data.country_name || "Unknown";
                    sourceRegionLocal = `${city}, ${country}`;

                    if (data.latitude && data.longitude) {
                        COORDINATES[sourceRegionLocal] = [data.latitude, data.longitude];
                    }
                } catch (err) {
                    console.error("Failed to get location from ipapi.co", err);
                    city = "Unknown";
                }
            } else {
                sourceRegionLocal = browserAgentState.sourceRegion || "Unknown";
            }

            setBrowserAgentState({ city, pinging: true, sourceRegion: sourceRegionLocal });

            const agentId = `browser-${city?.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(Math.random() * 1000)}`;

            console.log(`🚀 Browser Agent [${agentId}] running from ${sourceRegionLocal} (Interval: ${intervalMs}ms)`);

            const pollAndProbe = async () => {
                let currentTargets = FALLBACK_TARGETS;
                try {
                    const tResp = await fetch(`${backendUrl}/api/v1/targets`);
                    if (tResp.ok) {
                        const data = await tResp.json();
                        if (data && data.length > 0) {
                            currentTargets = data;
                        }
                    }
                } catch (err) {
                    console.warn("Failed to fetch dynamic targets, using fallbacks", err);
                }

                const measurements = [];
                for (const target of currentTargets) {
                    const start = performance.now();
                    let status = "ERROR";
                    let latencyMs = 0;

                    try {
                        await fetch(target.url, { mode: "no-cors", cache: "no-store", keepalive: false });
                        latencyMs = performance.now() - start;
                        status = "SUCCESS";
                    } catch (err) {
                        status = "ERROR";
                    }

                    measurements.push({
                        targetHost: target.host,
                        targetRegion: target.region,
                        latencyMs: latencyMs,
                        packetLoss: status === "SUCCESS" ? 0.0 : 1.0,
                        status: status,
                        measuredAt: new Date().toISOString(),
                    });
                }

                try {
                    await fetch(`${backendUrl}/api/v1/measurements`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            agentId: agentId,
                            sourceRegion: sourceRegionLocal,
                            measurements: measurements,
                        }),
                    });
                } catch (err) {
                    console.error("Failed to post browser measurements", err);
                }
            };

            // Clear old interval if exists
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            pollAndProbe();
            intervalRef.current = setInterval(pollAndProbe, intervalMs);
        };

        startAgent();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, intervalMs, browserAgentState.city]);

    return browserAgentState;
}
