package com.netpulse.server.application.service;

import com.netpulse.server.domain.model.TracerouteHop;
import com.netpulse.server.domain.port.TracerouteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TracerouteService {

    private final TracerouteRepository repository;

    public TracerouteService(TracerouteRepository repository) {
        this.repository = repository;
    }

    public void ingest(List<TracerouteHop> hops) {
        repository.saveAll(hops);
    }

    public List<TracerouteHop> getLatestByTarget(String targetHost) {
        return repository.findLatestByTargetHost(targetHost);
    }
}
