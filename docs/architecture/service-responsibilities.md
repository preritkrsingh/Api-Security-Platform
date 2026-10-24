# Service Responsibilities and System Boundaries

This document formalizes the architectural responsibilities, data boundaries, and operational scopes for all services in the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

---

## 1. API Gateway (`gateway`)

* **Role**: Primary perimeter ingress and dynamic reverse proxy.
* **Technology**: Java 21, Spring Boot 3.4.3, Spring Cloud Gateway (Netty, WebFlux).
* **Port**: `8080` (configurable via `GATEWAY_PORT`).
* **Responsibilities**:
  1. **Dynamic Target Routing**: Intercept `/proxy/{apiId}/**` requests and dynamically route to authorized upstream services.
  2. **Caller Authentication**: Enforce constant-time SHA-256 API key verification; reject missing, invalid, or revoked credentials (401).
  3. **Credential Stripping**: Remove `X-API-Key` headers before traffic leaves the gateway for upstream services.
  4. **Perimeter Policy Enforcement**: Enforce allowed HTTP methods (405), allowed path prefixes (403), request body limits (413), and in-memory token bucket rate limits (429).
  5. **Safe Metadata Extraction**: Collect sanitized request telemetry (method, path, status, latency, request/response size) without bodies or headers.
  6. **Resilience & Fault Isolation**: Enforce connection and response timeouts; return structured 503/504 JSON errors on downstream failures to isolate faults.
* **Boundaries**: Does not execute business logic or maintain permanent database connections.

---

## 2. Protected Sample Backend (`sample-backend`)

* **Role**: Reference business API representing an enterprise backend.
* **Technology**: Java 21, Spring Boot 3.4.3 (Tomcat, Spring MVC).
* **Port**: `8081` (configurable via `SAMPLE_BACKEND_PORT`).
* **Responsibilities**:
  1. **Endpoint Provisioning**: Expose operational health endpoint (`/api/health`) and business resource demonstration endpoint (`/api/demo/resource`).
  2. **Traffic Target**: Act as the verified upstream destination for gateway integration tests and onboarding validation.
  3. **Baseline Simulation**: Serve consistent responses for measuring baseline latency and error rates.
* **Boundaries**: Is unaware of the threat detection mechanism; operates entirely behind the gateway.

---

## 3. Control Plane (`control-plane`)

* **Role**: Management plane, security telemetry aggregation, policy enforcement, and configuration API.
* **Technology**: Java 21, Spring Boot 3.4.3 (Tomcat, Spring MVC, Spring Data JPA, Virtual Threads).
* **Port**: `8082` (configurable via `CONTROL_PLANE_PORT`).
* **Responsibilities**:
  1. **Project & API Management**: CRUD operations for projects, environments (DEV, TEST, PROD), API registrations, and allowed path/method policies.
  2. **Cryptographic Key Lifecycle**: Generate 256-bit secure API keys (`asp_live_...`), persist SHA-256 hashes, provide prefix lookup, and handle immediate key revocation.
  3. **SSRF Guardrails**: Validate upstream URLs against loopback, private RFC 1918 subnets, and cloud instance metadata (`169.254.169.254`).
  4. **Active Upstream Probing**: Probe upstream endpoint reachability and measure baseline round-trip latency.
  5. **Telemetry Store**: Ingest safe traffic telemetry and persist operational history.
  6. **Out-of-Band ML Dispatch**: Asynchronously dispatch traffic telemetry to the Python threat detection service using Java 21 virtual threads (`ThreatDetectionClient`).
  7. **Security Incident Logging**: Persist perimeter security events (e.g. 401 Unauthorized, 429 Rate Limit Exceeded) and high-risk ML anomaly events to the database.
* **Boundaries**: Operates out-of-band; does not block the inline client request path.

---

## 4. Threat Detection Engine (`threat-detection`)

* **Role**: Machine-learning-driven statistical anomaly scoring and risk assessment.
* **Technology**: Python 3.11, FastAPI, Uvicorn, Scikit-learn, Pandas, NumPy.
* **Port**: `8000` (configurable via `THREAT_DETECTION_PORT`).
* **Responsibilities**:
  1. **Feature Engineering**: Extract feature vectors from request telemetry (path depth, request frequency, payload size, path entropy).
  2. **Model Inference**: Execute unsupervised Scikit-learn `IsolationForest` model to detect statistical outliers.
  3. **Heuristic Rule Engine**: Detect path traversal patterns (`../`), hidden directory probes, and scanner user-agents (sqlmap, nikto, masscan, nmap).
  4. **Risk Scoring**: Output normalized risk scores (`0.0` to `1.0`), categorical severity tiers (LOW, MEDIUM, HIGH, CRITICAL), and actionable indicator flags.
  5. **Model Health Status**: Expose `/health` with readiness and model version metadata.
* **Boundaries**: Evaluates telemetry metadata out-of-band; does not inspect plaintext bodies or alter database records directly.

---

## 5. Persistence & In-Memory Services

### 5.1 PostgreSQL Database
* **Role**: ACID-compliant long-term store for projects, API registrations, hashed credentials, safe traffic records, and security incident events.
* **Port**: `5435` (container) / `5432` (standard).
* **Test Fallback**: In-memory H2 database with complete schema parity.

### 5.2 Redis In-Memory Store
* **Role**: High-speed cache for distributed sliding-window rate limiting counters and temporary token verification cache.
* **Port**: `6379`.

---

## 6. Security Dashboard (`frontend`)

* **Role**: Professional single-page application for developers, security analysts, and platform administrators.
* **Technology**: React 18, Tailwind CSS, Vite.
* **Port**: `3000`.
* **Responsibilities**:
  1. **9 Core Views**: Overview, Projects, APIs, Traffic Monitoring, Threat Detection, Risk Assessments, Security Policies, Settings, Help / How to Use.
  2. **6-Step API Wizard**: Guided step-by-step onboarding with server-side SSRF validation and live connectivity probing.
  3. **Interactive Console**: Live gateway testing console generating dynamic cURL commands and probing `/proxy/{apiId}/**`.
  4. **Zero-Mock Policy**: Strictly displays live backend data; renders genuine loading, error, and empty states without synthetic stubs.
  5. **System Health Rails**: Real-time service status pills for Gateway (:8080), Control Plane (:8082), and AI Threat Detection (:8000).
