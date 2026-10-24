# System Requirements Specification

This document details the functional and non-functional requirements for the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

---

## 1. Functional Requirements (FR)

### Ingress & API Gateway (FR-01 to FR-04)
* **FR-01 (Reverse Proxy Routing)**: The gateway shall receive all external client HTTP requests targeted at `/api/**` and route them to the appropriate downstream backend services.
* **FR-02 (Configurable Targets)**: The gateway shall dynamically configure downstream service targets via environment variables without requiring code changes.
* **FR-03 (Telemetry Extraction)**: The gateway shall extract non-sensitive request metadata (HTTP method, normalized URI path, client IP, header names, content length, timestamp) for threat analysis.
* **FR-04 (Sanitized Logging)**: The gateway logging layer shall strictly redact sensitive authentication headers (`Authorization`, `Cookie`, `X-API-Key`) and omit request/response payload bodies.

### Fault Tolerance & Resilience (FR-05 to FR-06)
* **FR-05 (Graceful Failure Handling)**: If a downstream service is unreachable or encounters a network error, the gateway shall return a structured `503 Service Unavailable` JSON response without leaking internal stack traces.
* **FR-06 (Configurable Timeouts)**: The gateway shall enforce configurable connection and response timeouts (e.g. 3000ms / 5000ms) and return a structured `504 Gateway Timeout` when timeouts are exceeded.

### Control Plane & Security Management (FR-07 to FR-09)
* **FR-07 (Health Verification)**: Every backend component (gateway, protected backend, control plane) shall expose standardized health verification endpoints (`/actuator/health` and dedicated service health paths).
* **FR-08 (Security Event Ingestion)**: The control plane shall provide an endpoint (`POST /api/v1/security-events`) to receive, validate, and persist security incident telemetry.
* **FR-09 (Security Event Retrieval)**: The control plane shall provide query capabilities (`GET /api/v1/security-events`) to retrieve incident records with severity filtering.

### Threat Detection & Risk Scoring (Phase 3 - FR-10 to FR-12)
* **FR-10 (Anomaly Inference)**: The threat detection service shall evaluate request feature vectors using unsupervised machine learning models (e.g., Isolation Forest) and return a normalized risk score between 0.0 and 1.0.
* **FR-11 (Explainable Indicators)**: Threat responses shall supply categorical indicators (e.g., `UNUSUAL_PATH_DEPTH`, `ANOMALOUS_VELOCITY`) explaining the score.
* **FR-12 (Graduated Enforcement)**: The system shall distinguish statistical anomaly from confirmed attack, applying graduated policies (LOG -> THROTTLE -> BLOCK).

---

## 2. Non-Functional Requirements (NFR)

* **NFR-01 (Performance & Low Latency)**: Gateway routing overhead must not exceed 15ms at 95th percentile under normal baseline loads.
* **NFR-02 (Data Privacy & Zero Secret Leakage)**: Passwords, tokens, cookies, and customer PII must never be stored in logs, transmitted to ML models, or committed to version control.
* **NFR-03 (Modularity & Extensibility)**: The architecture must use decoupled microservices that can be deployed, scaled, or upgraded independently.
* **NFR-04 (Container Portability)**: All services must be fully containerized via standard Dockerfiles and orchestratable using Docker Compose.
* **NFR-05 (Standardized Protocols)**: All inter-service communication must use standard REST/JSON protocols over HTTP/HTTPS.
* **NFR-06 (Comprehensive Test Automation)**: All backend components must feature automated unit and integration tests executable via standard Maven commands.
* **NFR-07 (Resilience Under Load)**: The gateway must remain stable and responsive even if downstream backend services become slow or unresponsive.
* **NFR-08 (Auditability)**: All security events and administrative configuration changes must generate traceable audit records with timestamps and originating client identifiers.
