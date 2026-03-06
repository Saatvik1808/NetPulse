package com.netpulse.server.adapter.outbound.persistence;

import com.netpulse.server.domain.model.TracerouteHop;
import com.netpulse.server.domain.port.TracerouteRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TracerouteRepositoryAdapter implements TracerouteRepository {

    private final JpaTracerouteHopRepository jpaRepo;

    public TracerouteRepositoryAdapter(JpaTracerouteHopRepository jpaRepo) {
        this.jpaRepo = jpaRepo;
    }

    @Override
    public void saveAll(List<TracerouteHop> hops) {
        List<TracerouteHopEntity> entities = hops.stream()
                .map(h -> new TracerouteHopEntity(
                        h.agentId(), h.sourceRegion(), h.targetHost(),
                        h.hopNumber(), h.hopIp(), h.hopRttMs(),
                        h.timedOut(), h.tracedAt()))
                .toList();
        jpaRepo.saveAll(entities);
    }

    @Override
    public List<TracerouteHop> findLatestByTargetHost(String targetHost) {
        return jpaRepo.findLatestByTargetHost(targetHost).stream()
                .map(e -> new TracerouteHop(
                        e.getId(), e.getAgentId(), e.getSourceRegion(), e.getTargetHost(),
                        e.getHopNumber(), e.getHopIp(), e.getHopRttMs(),
                        e.getTimedOut(), e.getTracedAt(), e.getCreatedAt()))
                .toList();
    }
}
