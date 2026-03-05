package com.netpulse.server.adapter.outbound.persistence;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "measurements")
public class MeasurementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_id", nullable = false, length = 64)
    private String agentId;

    @Column(name = "source_region", nullable = false, length = 64)
    private String sourceRegion;

    @Column(name = "target_host", nullable = false, length = 255)
    private String targetHost;

    @Column(name = "target_region", length = 64)
    private String targetRegion;

    @Column(name = "latency_ms", nullable = false)
    private Double latencyMs;

    @Column(name = "packet_loss")
    private Double packetLoss;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected MeasurementEntity() {} // JPA requires a no-arg constructor

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // --- Getters and Setters ---
    // Write getters for ALL fields.
    // Write setters for all fields EXCEPT id and createdAt (those are managed by DB/JPA).

    public Long getId() { return id; }

    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }

    public String getSourceRegion() { return sourceRegion; }
    public void setSourceRegion(String sourceRegion) { this.sourceRegion = sourceRegion; }

    public String getTargetHost() { return targetHost; }
    public void setTargetHost(String targetHost) { this.targetHost = targetHost; }

    public String getTargetRegion() { return targetRegion; }
    public void setTargetRegion(String targetRegion) { this.targetRegion = targetRegion; }

    public Double getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Double latencyMs) { this.latencyMs = latencyMs; }

    public Double getPacketLoss() { return packetLoss; }
    public void setPacketLoss(Double packetLoss) { this.packetLoss = packetLoss; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }

    public Instant getCreatedAt() { return createdAt; }
}
