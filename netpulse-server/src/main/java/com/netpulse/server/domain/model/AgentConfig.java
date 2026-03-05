package com.netpulse.server.domain.model;

public record AgentConfig(
        Long id,
        Boolean browserPinging,
        Integer browserIntervalMs) {
}
