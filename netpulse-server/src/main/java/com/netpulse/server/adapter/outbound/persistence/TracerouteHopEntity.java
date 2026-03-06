package com.netpulse.server.adapter.outbound.persistence;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "traceroute_hops")
public class TracerouteHopEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_id", nullable = false)
    private String agentId;

    @Column(name = "source_region")
    private String sourceRegion;

    @Column(name = "target_host", nullable = false)
    private String targetHost;

    @Column(name = "hop_number", nullable = false)
    private Integer hopNumber;

    @Column(name = "hop_ip")
    private String hopIp;

    @Column(name = "hop_rtt_ms")
    private Double hopRttMs;

    @Column(name = "timed_out")
    private Boolean timedOut;

    @Column(name = "traced_at", nullable = false)
    private Instant tracedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    protected TracerouteHopEntity() {
    }

    public TracerouteHopEntity(String agentId, String sourceRegion, String targetHost,
            Integer hopNumber, String hopIp, Double hopRttMs,
            Boolean timedOut, Instant tracedAt) {
        this.agentId = agentId;
        this.sourceRegion = sourceRegion;
        this.targetHost = targetHost;
        this.hopNumber = hopNumber;
        this.hopIp = hopIp;
        this.hopRttMs = hopRttMs;
        this.timedOut = timedOut;
        this.tracedAt = tracedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getAgentId() {
        return agentId;
    }

    public String getSourceRegion() {
        return sourceRegion;
    }

    public String getTargetHost() {
        return targetHost;
    }

    public Integer getHopNumber() {
        return hopNumber;
    }

    public String getHopIp() {
        return hopIp;
    }

    public Double getHopRttMs() {
        return hopRttMs;
    }

    public Boolean getTimedOut() {
        return timedOut;
    }

    public Instant getTracedAt() {
        return tracedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
