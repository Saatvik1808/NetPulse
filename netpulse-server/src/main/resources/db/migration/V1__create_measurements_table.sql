-- V1: Core measurements table
-- Stores individual latency probe results from distributed agents

CREATE TABLE measurements (
    id              BIGSERIAL       PRIMARY KEY,
    agent_id        VARCHAR(64)     NOT NULL,
    source_region   VARCHAR(64)     NOT NULL,
    target_host     VARCHAR(255)    NOT NULL,
    target_region   VARCHAR(64),
    latency_ms      DOUBLE PRECISION NOT NULL,
    packet_loss     DOUBLE PRECISION DEFAULT 0.0,
    status          VARCHAR(16)     NOT NULL,
    measured_at     TIMESTAMPTZ     NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);



-- Index: regional dashboard queries (filter by region, sort by time)
CREATE INDEX idx_measurements_region_time
    ON measurements (source_region, measured_at DESC);

-- Index: global recent measurements
CREATE INDEX idx_measurements_time
    ON measurements (measured_at DESC);

-- Index: lookup by agent
CREATE INDEX idx_measurements_agent
    ON measurements (agent_id, measured_at DESC);
