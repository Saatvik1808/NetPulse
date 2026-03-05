"use client";

import { useState, useEffect, useCallback } from "react";
import { MeasurementData, fetchLatestMeasurements } from "@/lib/api";

export function useMeasurements(pollIntervalMs: number = 0) {
    const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const data = await fetchLatestMeasurements();
            setMeasurements(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Always fetch once on mount for initial data
        refresh();

        // Only poll if interval > 0
        if (pollIntervalMs > 0) {
            const interval = setInterval(refresh, pollIntervalMs);
            return () => clearInterval(interval);
        }
    }, [refresh, pollIntervalMs]);

    return { measurements, setMeasurements, loading, error, refresh };
}
