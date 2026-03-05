package com.netpulse.server.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JpaMeasurementRepository extends JpaRepository<MeasurementEntity, Long> {
    List<MeasurementEntity> findTop50ByOrderByMeasuredAtDesc();
}
