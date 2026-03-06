package com.netpulse.server.adapter.inbound.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public record TracerouteIngestRequest(
        @NotBlank String agentId,
        String sourceRegion,
        @NotBlank String targetHost,
        @NotNull List<HopEntry> hops,
        @NotNull Instant tracedAt) {
    public record HopEntry(
            int hopNumber,
            String ip,
            double rttMs,
            boolean timedOut) {
    }
}
