package com.netpulse.server.adapter.inbound.rest.dto;

import java.time.Instant;

public record TracerouteHopResponse(
        Long id,
        String agentId,
        String sourceRegion,
        String targetHost,
        Integer hopNumber,
        String hopIp,
        Double hopRttMs,
        Boolean timedOut,
        Instant tracedAt) {
}
