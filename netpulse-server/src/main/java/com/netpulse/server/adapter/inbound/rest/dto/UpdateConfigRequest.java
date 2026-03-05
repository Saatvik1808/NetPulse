package com.netpulse.server.adapter.inbound.rest.dto;

public record UpdateConfigRequest(
        Boolean browserPinging,
        Integer browserIntervalMs) {
}
