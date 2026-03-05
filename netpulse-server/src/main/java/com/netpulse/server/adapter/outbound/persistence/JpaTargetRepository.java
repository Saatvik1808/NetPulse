package com.netpulse.server.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JpaTargetRepository extends JpaRepository<TargetEntity, Long> {
    List<TargetEntity> findByActiveTrue();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE TargetEntity t SET t.active = false WHERE t.id = :id")
    void softDeleteById(Long id);
}
