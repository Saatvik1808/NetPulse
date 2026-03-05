package com.netpulse.server.adapter.inbound.rest.dto;

public record AddTargetRequest(
        String host,
        String url,
        String region) {
}
