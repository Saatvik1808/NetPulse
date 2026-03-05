package com.netpulse.server.domain.model;

import java.time.Instant;

/**
 * Domain entity representing a network latency measurement.
 * This class is "pure" - notice it has NO JPA or Spring annotations.
 * It defines WHAT a measurement is, not HOW it is stored.
 */
public record Measurement(
        Long id,
        String agentId,
        String sourceRegion,
        String targetHost,
        String targetRegion,
        Double latencyMs,
        Double packetLoss,
        MeasurementStatus status,
        Instant measuredAt,
        Instant createdAt
) {
    public enum MeasurementStatus {
        SUCCESS, TIMEOUT, ERROR
    }

    // Factory method for new measurements (before they have an ID or createdAt)
    public static Measurement createNew(
            String agentId,
            String sourceRegion,
            String targetHost,
            String targetRegion,
            Double latencyMs,
            Double packetLoss,
            MeasurementStatus status,
            Instant measuredAt) {
        return new Measurement(
                null,
                agentId,
                sourceRegion,
                targetHost,
                targetRegion,
                latencyMs,
                packetLoss,
                status,
                measuredAt,
                null
        );
    }
}
