package com.netpulse.server.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JpaTracerouteHopRepository extends JpaRepository<TracerouteHopEntity, Long> {

    @Query(value = """
            SELECT t.* FROM traceroute_hops t
            WHERE t.target_host = :targetHost
              AND t.traced_at = (
                SELECT MAX(t2.traced_at) FROM traceroute_hops t2 WHERE t2.target_host = :targetHost
              )
            ORDER BY t.hop_number ASC
            """, nativeQuery = true)
    List<TracerouteHopEntity> findLatestByTargetHost(@Param("targetHost") String targetHost);
}
