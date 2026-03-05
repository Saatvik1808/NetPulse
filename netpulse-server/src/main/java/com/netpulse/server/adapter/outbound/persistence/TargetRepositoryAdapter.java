package com.netpulse.server.adapter.outbound.persistence;

import com.netpulse.server.domain.model.Target;
import com.netpulse.server.domain.port.TargetRepository;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TargetRepositoryAdapter implements TargetRepository {

    private final JpaTargetRepository jpaRepository;

    public TargetRepositoryAdapter(JpaTargetRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Target save(Target target) {
        TargetEntity entity = new TargetEntity(
                target.id(),
                target.host(),
                target.url(),
                target.region(),
                target.active(),
                target.createdAt());
        TargetEntity saved = jpaRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public List<Target> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Target> findActive() {
        return jpaRepository.findByActiveTrue().stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    private Target mapToDomain(TargetEntity entity) {
        return new Target(
                entity.getId(),
                entity.getHost(),
                entity.getUrl(),
                entity.getRegion(),
                entity.getActive(),
                entity.getCreatedAt());
    }
}
