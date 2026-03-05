package com.netpulse.server.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JpaTargetRepository extends JpaRepository<TargetEntity, Long> {
    List<TargetEntity> findByActiveTrue();
}
