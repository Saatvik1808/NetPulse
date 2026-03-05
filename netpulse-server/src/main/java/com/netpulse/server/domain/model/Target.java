package com.netpulse.server.domain.model;

import java.time.ZonedDateTime;

public record Target(
        Long id,
        String host,
        String url,
        String region,
        Boolean active,
        ZonedDateTime createdAt) {
}
