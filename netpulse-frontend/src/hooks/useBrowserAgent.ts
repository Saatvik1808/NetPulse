"use client";

import { useEffect, useRef, useState } from "react";

interface TargetInfo {
    host: string;
    url: string;
    region: string;
}

const TARGETS: TargetInfo[] = [
    { host: "dns.google", url: "https://dns.google", region: "global" },
    { host: "cloudflare", url: "https://1.1.1.1", region: "global" },
    { host: "aws.amazon", url: "https://aws.amazon.com", region: "us-east" },
    { host: "github.com", url: "https://github.com", region: "us-east" },
];

export function useBrowserAgent() {
    const [browserAgentState, setBrowserAgentState] = useState<{
        city: string | null;
        pinging: boolean;
    }>({ city: null, pinging: false });

    const isRunningRef = useRef(false);

    useEffect(() => {
        if (isRunningRef.current) return;
        isRunningRef.current = true;

        const startAgent = async () => {
            // 1. Get user location
            let city = "Unknown";
            let country = "Unknown";
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (data.city) city = data.city;
                if (data.country_name) country = data.country_name;
            } catch (err) {
                console.error("Failed to get location from ipapi.co", err);
            }

            setBrowserAgentState({ city, pinging: true });

            const agentId = `browser-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(Math.random() * 1000)}`;
            const sourceRegion = `${city}, ${country}`;

            console.log(`🚀 Browser Agent [${agentId}] started from ${sourceRegion}`);

            // 2. Poll targets periodically
            const pollTargets = async () => {
                const measurements = [];

                for (const target of TARGETS) {
                    const start = performance.now();
                    let status = "ERROR";
                    let latencyMs = 0;

                    try {
                        // Using no-cors to bypass CORS blocks on external domains
                        // cache: 'no-store' forces a real network request
                        await fetch(target.url, { mode: "no-cors", cache: "no-store", keepalive: false });
                        latencyMs = performance.now() - start;
                        status = "SUCCESS";
                    } catch (err) {
                        console.warn(`Browser ping to ${target.host} failed`, err);
                        status = "ERROR";
                    }

                    measurements.push({
                        target_host: target.host,
                        target_region: target.region,
                        latency_ms: latencyMs,
                        packet_loss: status === "SUCCESS" ? 0.0 : 1.0,
                        status: status,
                        measured_at: new Date().toISOString(),
                    });
                }

                // 3. POST to backend
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                try {
                    await fetch(`${backendUrl}/api/v1/measurements`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            agent_id: agentId,
                            source_region: sourceRegion,
                            measurements: measurements,
                        }),
                    });
                } catch (err) {
                    console.error("Failed to post browser measurements to backend", err);
                }
            };

            // Poll every 5 seconds
            pollTargets();
            const interval = setInterval(pollTargets, 5000);

            return () => clearInterval(interval);
        };

        startAgent();
    }, []);

    return browserAgentState;
}
