# 🌐 NetPulse — Global Internet Latency Map Platform

> Real-time visibility into how the internet performs across the globe.

---

## What is NetPulse?

NetPulse is a **distributed network latency monitoring platform** that measures, records, and visualizes internet latency between geographic regions in real time.

Think of it as a **living health map of the internet** — lightweight agents deployed around the world continuously ping endpoints, and the results are streamed to an interactive world map where you can see latency, packet loss, and connectivity patterns *as they happen*.

### The core loop

```
   Agents probe endpoints  →  Results sent to backend  →  Stored in time-series DB
                                                                  ↓
              Live world map  ←  WebSocket stream  ←  Backend broadcasts
```

---

## Why are we building this?

### The problem

The internet isn't a single network — it's thousands of interconnected networks, and latency between any two points varies constantly depending on routing, congestion, peering agreements, and infrastructure health. Yet most monitoring tools only tell you about *your* network, not the global picture.

### What NetPulse solves

| Challenge | NetPulse's answer |
|---|---|
| **No global view** — existing tools are point-to-point or vendor-locked | A self-hosted network of agents that you control, measuring whatever endpoints matter to you |
| **Data is stale** — periodic reports don't capture real-time shifts | Sub-second WebSocket streaming to a live map |
| **Hard to correlate** — raw ping data in logs isn't actionable | Aggregated dashboards, historical trends, and anomaly (spike) detection |
| **Doesn't scale** — ad-hoc scripts break when you add regions | A streaming architecture (Kafka) designed for thousands of measurements per minute |

### Who is it for?

- **Infrastructure teams** who need to monitor multi-region deployments.
- **SREs** investigating cross-region latency anomalies.
- **Network engineers** benchmarking ISP and cloud provider performance.
- **Anyone** who wants to understand how the internet performs between two points.

### What you'll learn by building it

This is also a **learning project** designed to teach production-grade distributed systems engineering:

- Writing distributed agents in **Go**
- Building clean-architecture backends with **Java / Spring Boot**
- Time-series data modeling with **PostgreSQL / TimescaleDB**
- Real-time streaming with **WebSockets** and **Kafka**
- Interactive data visualization with **Next.js** and **D3.js**
- Containerization and orchestration with **Docker**

---

## How does it work?

### Architecture overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NetPulse Platform                             │
│                                                                      │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐                    │
│   │  Agent      │  │  Agent      │  │  Agent      │   ← Go binaries  │
│   │  us-east    │  │  eu-west    │  │  ap-south   │     deployed per  │
│   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     region         │
│         │               │               │                            │
│         └───────────┬───┴───────────────┘                            │
│                     ▼                                                │
│         ┌──────────────────────┐                                     │
│         │  Backend API          │  ← Spring Boot                     │
│         │  (ingest + query)     │    Clean / Hexagonal architecture  │
│         └─────┬──────┬─────────┘                                     │
│               │      │                                               │
│               ▼      ▼                                               │
│     ┌─────────────┐  ┌───────────────┐                               │
│     │ PostgreSQL / │  │ WebSocket     │                               │
│     │ TimescaleDB  │  │ Server        │                               │
│     └─────────────┘  └───────┬───────┘                               │
│                              ▼                                       │
│                    ┌──────────────────┐                               │
│                    │  Next.js Frontend │  ← Interactive world map     │
│                    │  (D3.js map)      │    with live updates         │
│                    └──────────────────┘                               │
└──────────────────────────────────────────────────────────────────────┘
```

### The data flow, step by step

1. **Agents probe** — Each Go agent reads a config file listing target hosts. Every few seconds, it pings each target (ICMP or TCP) and records the round-trip time.

2. **Agents push** — Measurements are batched into a JSON payload and sent via `POST /api/v1/measurements` to the backend. Retries with exponential backoff on failure.

3. **Backend ingests** — The Spring Boot service validates the payload, persists it to PostgreSQL, and broadcasts the new data to all connected WebSocket clients.

4. **Database stores** — PostgreSQL (later upgraded to TimescaleDB for automatic time-partitioning) holds every measurement with timestamps, latency, packet loss, and region metadata.

5. **Frontend visualizes** — The Next.js app loads agent positions and latest measurements on page load, then subscribes to the WebSocket for live updates. D3.js renders arcs on a world map, color-coded from green (low latency) to red (high latency).

### Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Agents** | Go | Lightweight, compiles to a single binary, native concurrency for parallel probes |
| **Backend** | Java 21 + Spring Boot 3 | Mature ecosystem, hexagonal architecture support, excellent for complex business logic |
| **Database** | PostgreSQL → TimescaleDB | Start simple, upgrade in-place by converting tables to hypertables |
| **Real-time** | WebSockets (STOMP) | Push-based updates without polling; built into Spring Boot |
| **Streaming** | Apache Kafka (Phase 3) | Decouple agents from backend; handle burst traffic and scale consumers independently |
| **Frontend** | Next.js + D3.js | SSR for performance, D3 for full control over map projections |
| **Infrastructure** | Docker + Docker Compose | Consistent environments, one-command local setup |

### Key design decisions

- **Clean Architecture** — The backend is structured with domain, application, and adapter layers. The domain layer has zero dependencies on frameworks. This makes the system testable, swappable, and easy to extend.

- **Schema-first** — Database migrations (Flyway) are written before application code. The schema is the source of truth.

- **Incremental complexity** — We start with HTTP + PostgreSQL and only add Kafka and TimescaleDB when the simpler approach has been proven. Every upgrade is additive, not a rewrite.

- **Batch ingestion** — Agents send arrays of measurements in a single HTTP request to minimize connection overhead.

---

## Build phases

| Phase | What gets built | Outcome |
|---|---|---|
| **Phase 1 — MVP** | Backend API, Go agent, database, basic map | End-to-end working system |
| **Phase 2 — Real-time** | WebSocket streaming, live map, aggregation | Users see latency changes instantly |
| **Phase 3 — Scale** | Kafka pipeline, distributed agents | Handle thousands of measurements/min |
| **Phase 4 — Intelligence** | Anomaly detection, historical replay | Actionable insights from data |
| **Phase 5 — Production** | Docker orchestration, CI/CD, monitoring | Ready for deployment |

---

## Quick start

> 🚧 *Coming soon — we're building this step by step. Check back as milestones are completed.*

```bash
# Clone the repo
git clone https://github.com/your-org/NetPulse.git
cd NetPulse

# Start everything
docker-compose up -d

# The map will be available at http://localhost:3000
```

---

## Project structure

```
NetPulse/
├── netpulse-agent/        # Go — Distributed latency probes
├── netpulse-server/       # Java — Backend API & WebSocket server
├── netpulse-frontend/     # Next.js — World map visualization
├── docker-compose.yml     # Local development environment
└── README.md              # ← You are here
```

---

## License

MIT

---

<p align="center">
  <strong>NetPulse</strong> — See the internet breathe. 🫁
</p>
