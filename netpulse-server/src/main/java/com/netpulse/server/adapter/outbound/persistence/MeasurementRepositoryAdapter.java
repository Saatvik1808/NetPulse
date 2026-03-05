package com.netpulse.server.adapter.outbound.persistence;

import com.netpulse.server.domain.model.Measurement;
import com.netpulse.server.domain.port.MeasurementRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MeasurementRepositoryAdapter implements MeasurementRepository {

    private final JpaMeasurementRepository jpaRepository;

    public MeasurementRepositoryAdapter(JpaMeasurementRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Measurement save(Measurement measurement) {
        MeasurementEntity entity = toEntity(measurement);
        MeasurementEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<Measurement> saveAll(List<Measurement> measurements) {
        List<MeasurementEntity> entities = measurements.stream()
                .map(this::toEntity)
                .toList();
        return jpaRepository.saveAll(entities).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Measurement> findLatest(int limit) {
        return jpaRepository.findTop50ByOrderByMeasuredAtDesc().stream()
                .map(this::toDomain)
                .toList();
    }

    // --- Mappers ---

    private MeasurementEntity toEntity(Measurement m) {
        MeasurementEntity e = new MeasurementEntity();
        e.setAgentId(m.agentId());
        e.setSourceRegion(m.sourceRegion());
        e.setTargetHost(m.targetHost());
        e.setTargetRegion(m.targetRegion());
        e.setLatencyMs(m.latencyMs());
        e.setPacketLoss(m.packetLoss());
        e.setStatus(m.status().name());
        e.setMeasuredAt(m.measuredAt());
        return e;
    }

    private Measurement toDomain(MeasurementEntity e) {
        return new Measurement(
                e.getId(),
                e.getAgentId(),
                e.getSourceRegion(),
                e.getTargetHost(),
                e.getTargetRegion(),
                e.getLatencyMs(),
                e.getPacketLoss(),
                Measurement.MeasurementStatus.valueOf(e.getStatus()),
                e.getMeasuredAt(),
                e.getCreatedAt()
        );
    }
}
