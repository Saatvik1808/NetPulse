package com.netpulse.server.adapter.outbound.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "agent_config")
public class AgentConfigEntity {

    @Id
    private Long id;

    @Column(name = "browser_pinging", nullable = false)
    private Boolean browserPinging;

    @Column(name = "browser_interval_ms", nullable = false)
    private Integer browserIntervalMs;

    // JPA requires a no-args constructor
    protected AgentConfigEntity() {
    }

    public AgentConfigEntity(Long id, Boolean browserPinging, Integer browserIntervalMs) {
        this.id = id;
        this.browserPinging = browserPinging;
        this.browserIntervalMs = browserIntervalMs;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getBrowserPinging() {
        return browserPinging;
    }

    public void setBrowserPinging(Boolean browserPinging) {
        this.browserPinging = browserPinging;
    }

    public Integer getBrowserIntervalMs() {
        return browserIntervalMs;
    }

    public void setBrowserIntervalMs(Integer browserIntervalMs) {
        this.browserIntervalMs = browserIntervalMs;
    }
}
