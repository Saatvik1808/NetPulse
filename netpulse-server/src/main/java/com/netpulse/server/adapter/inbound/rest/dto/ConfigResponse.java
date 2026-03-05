package com.netpulse.server.adapter.inbound.rest.dto;

public record ConfigResponse(
        Boolean browserPinging,
        Integer browserIntervalMs) {
}
