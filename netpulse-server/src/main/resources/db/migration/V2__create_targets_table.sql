-- V2: Create targets table for dynamic target discovery

CREATE TABLE targets (
    id          BIGSERIAL       PRIMARY KEY,
    host        VARCHAR(255)    NOT NULL,
    url         VARCHAR(1024)   NOT NULL,
    region      VARCHAR(64)     NOT NULL,
    active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Seed some initial targets so the UI and agents aren't empty on launch
INSERT INTO targets (host, url, region, active) VALUES
('dns.google', 'https://dns.google', 'global', true),
('cloudflare.com', 'https://cloudflare.com', 'global', true),
('aws.amazon.com', 'https://aws.amazon.com', 'us-east', true),
('github.com', 'https://github.com', 'us-east', true);
