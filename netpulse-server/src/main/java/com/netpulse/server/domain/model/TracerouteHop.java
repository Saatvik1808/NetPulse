package com.netpulse.server.domain.model;

import java.time.Instant;

public record TracerouteHop(
        Long id,
        String agentId,
        String sourceRegion,
        String targetHost,
        Integer hopNumber,
        String hopIp,
        Double hopRttMs,
        Boolean timedOut,
        Instant tracedAt,
        Instant createdAt) {
    public static TracerouteHop createNew(
            String agentId,
            String sourceRegion,
            String targetHost,
            Integer hopNumber,
            String hopIp,
            Double hopRttMs,
            Boolean timedOut,
            Instant tracedAt) {
        return new TracerouteHop(null, agentId, sourceRegion, targetHost, hopNumber, hopIp, hopRttMs, timedOut,
                tracedAt, null);
    }
}
