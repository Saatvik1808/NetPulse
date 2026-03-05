package com.netpulse.server.adapter.inbound.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;

public record IngestRequest(
                @NotBlank String agentId,
                @NotBlank String sourceRegion,
                @NotEmpty @Valid List<MeasurementEntry> measurements) {
        public record MeasurementEntry(
                        @NotBlank String targetHost,
                        String targetRegion,
                        Double latencyMs,
                        Double packetLoss,
                        @NotBlank String status,
                        Instant measuredAt) {
        }
}
