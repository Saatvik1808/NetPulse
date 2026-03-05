CREATE TABLE agent_config (
    id BIGINT PRIMARY KEY,
    browser_pinging BOOLEAN NOT NULL DEFAULT TRUE,
    browser_interval_ms INTEGER NOT NULL DEFAULT 5000,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert the single global configuration row
INSERT INTO agent_config (id, browser_pinging, browser_interval_ms) VALUES (1, true, 5000);
