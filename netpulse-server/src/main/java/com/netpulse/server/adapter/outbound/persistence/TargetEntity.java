package com.netpulse.server.adapter.outbound.persistence;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "targets")
public class TargetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String host;

    @Column(nullable = false, length = 1024)
    private String url;

    @Column(nullable = false, length = 64)
    private String region;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private ZonedDateTime createdAt;

    protected TargetEntity() {
        // JPA requires no-arg constructor
    }

    public TargetEntity(Long id, String host, String url, String region, Boolean active, ZonedDateTime createdAt) {
        this.id = id;
        this.host = host;
        this.url = url;
        this.region = region;
        this.active = active;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = ZonedDateTime.now();
        }
        if (this.active == null) {
            this.active = true;
        }
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getHost() {
        return host;
    }

    public String getUrl() {
        return url;
    }

    public String getRegion() {
        return region;
    }

    public Boolean getActive() {
        return active;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }
}
