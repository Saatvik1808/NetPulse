package com.netpulse.server.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaConfigRepository extends JpaRepository<AgentConfigEntity, Long> {
}
