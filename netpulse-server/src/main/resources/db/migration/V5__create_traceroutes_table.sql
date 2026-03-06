CREATE TABLE traceroute_hops (
    id          BIGSERIAL PRIMARY KEY,
    agent_id    VARCHAR(100) NOT NULL,
    source_region VARCHAR(100),
    target_host VARCHAR(255) NOT NULL,
    hop_number  INT NOT NULL,
    hop_ip      VARCHAR(50),
    hop_rtt_ms  DOUBLE PRECISION,
    timed_out   BOOLEAN DEFAULT FALSE,
    traced_at   TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traceroute_target ON traceroute_hops(target_host, traced_at DESC);
