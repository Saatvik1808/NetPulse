package com.netpulse.server.adapter.inbound.rest.dto;

import java.time.Instant;

public record MeasurementResponse(
        Long id,
        String agentId,
        String sourceRegion,
        String targetHost,
        String targetRegion,
        Double latencyMs,
        Double packetLoss,
        String status,
        Instant measuredAt,
        Instant createdAt
) {}
