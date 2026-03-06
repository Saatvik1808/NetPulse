package com.netpulse.server.domain.port;

import com.netpulse.server.domain.model.TracerouteHop;

import java.util.List;

public interface TracerouteRepository {
    void saveAll(List<TracerouteHop> hops);

    List<TracerouteHop> findLatestByTargetHost(String targetHost);
}
