# AI-Based API Security Threat Detection and Risk Assessment Platform

## 1. Project Objective

The **AI-Based API Security Threat Detection and Risk Assessment Platform** monitors modern API traffic, analyzes non-sensitive operational telemetry, assesses risk levels in real time, and logs security events for actionable threat mitigation.

Operating as an intelligent API security gateway and control plane, the platform safeguards microservices and APIs against credential stuffing, automated bot scanning, API fuzzing, and volumetric anomalies without violating client data privacy.

---

## 2. Key Features (First 30% Milestone)

* **Project & Multi-Environment Management**: Complete project workspace isolation (`DEVELOPMENT`, `TESTING`, `PRODUCTION`) with cascading resource cleanup.
* **Dynamic Reverse Proxy Gateway**: High-throughput reactive routing via `/proxy/{apiId}/**` to registered upstream destinations without restarting the gateway.
* **SSRF Shielding**: Destination IP filtering blocking private subnets, loopbacks, and cloud metadata (`169.254.169.254`), with controlled local developer mode.
* **Cryptographic API Credentials**: 256-bit secure random key generation (`asp_live_...`), single-display secret exposure, SHA-256 hash persistence, prefix identification, and instant revocation.
* **Runtime Policy Enforcement**: Enforces allowed HTTP methods (405), path prefixes (403), request body limits (413), and in-memory token-bucket rate limits (429).
* **Header Sanitization**: Platform credentials (`X-API-Key`) are verified at the gateway and stripped before forwarding to upstream targets.
* **Safe Traffic Telemetry**: Privacy-first metadata extraction (method, normalized path, duration, status code, byte counts, client IP) strictly excluding passwords and request bodies.
* **Upstream Fault Isolation**: Downstream connectivity failures and timeouts yield standardized, clean `503 Service Unavailable` or `504 Gateway Timeout` JSON error payloads.
* **Modern Developer UI**: Single-page onboarding interface built with React 19, TypeScript, and Tailwind CSS 4, including live connectivity probing, key generation modals, and an interactive gateway testing console.

---

## 3. Technology Stack

* **API Gateway**: Java 21, Spring Boot 3.4.3, Spring Cloud Gateway 2024.0.0 (Netty / Project Reactor)
* **Control Plane**: Java 21, Spring Boot 3.4.3, Spring Data JPA, Jakarta Validation
* **Persistence**: PostgreSQL 16 (H2 fallback for zero-dependency local dev and testing)
* **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite, Lucide React
* **Build & Orchestration**: Apache Maven 3.9+, Docker, Docker Compose
* **Threat Detection Engine (Phase 3 Contract)**: Python / FastAPI (pre-integrated schema)

---

## 4. System Architecture

```
[ Client Request with X-API-Key ]
                |
                v
[ Spring Cloud Gateway : 8080 ]
  ├── 1. Dynamic Route Resolution (/proxy/{apiId}/**)
  ├── 2. SHA-256 Key Validation & Header Sanitization
  ├── 3. Method & Path Prefix Enforcement
  ├── 4. Token-Bucket Rate Limiter (e.g. 100 req/s)
  ├── 5. Forward to Upstream --> [ Target Upstream API / Microservice ]
  └── 6. Async Safe Telemetry --> [ Control Plane : 8082 ] -> [ PostgreSQL / H2 ]
```

Documentation References:
* [How to Onboard & Protect Any Project](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/how-to-onboard-any-project.md) (Complete Tutorial with E-Commerce Case Study)
* [User Guide (Beginner-Friendly)](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/user-guide.md)
* [Architecture Overview](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/architecture/overview.md)
* [Security Model & SSRF Architecture](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/architecture/security.md)
* [Control Plane REST API Contract](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/api/project-api-contract.md)
* [Gateway Dynamic Proxy Contract](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/api/gateway-contract.md)
* [Threat Detection Metadata Schema](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/api/threat-detection-metadata-schema.md)
* [Implementation Status Report](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/docs/IMPLEMENTATION_STATUS.md)

---

## 5. Development Status

| Phase | Milestone | Scope | Status |
|---|---|:---:|:---:|
| **Phase 1** | Foundation and Requirements | 10% | **COMPLETED & VERIFIED** |
| **Phase 2** | API Onboarding, Backend and Gateway | 20% | **COMPLETED & VERIFIED** |
| **Phase 3** | AI Detection and Risk Assessment | 20% | **COMPLETED & VERIFIED** |
| **Phase 4** | Data Persistence & Security Integration | 10% | **COMPLETED & VERIFIED** |
| **Phase 5** | Security Dashboard & Red-Team Simulator | 20% | Planned |
| **Phase 6** | System Hardening, Evaluation & Research | 20% | Planned |

---

## 6. Local Setup and Startup Instructions

### Prerequisites
* Java Development Kit (JDK) 21
* Apache Maven 3.9+
* Python 3.11+
* Node.js v20+ & npm
* Docker & Docker Compose (for containerized execution)

### 1. Build and Test All Services
```bash
# Execute all backend Java unit/integration tests (24 passing)
mvn clean test

# Execute AI threat detection pytest suite (6 passing)
./threat-detection/venv/bin/pytest threat-detection/test_detector.py

# Build the frontend production bundle (Vite)
cd frontend && npm install && npm run build && cd ..
```

### 2. Standalone Local Execution

#### Start AI Threat Detector (Port 8000)
```bash
cd threat-detection
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Start Control Plane (Port 8082)
```bash
cd control-plane
mvn spring-boot:run
```

#### Start API Gateway (Port 8080)
```bash
cd gateway
mvn spring-boot:run
```

#### Start Onboarding Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

---

## 7. Docker Compose Execution

To start all services with PostgreSQL 16 container:
```bash
# Validate compose configuration
docker compose config

# Build and start services in detached mode
docker compose up --build -d

# Verify container health
docker compose ps
```

Container Port Mapping:
* **Frontend UI**: `http://localhost:3000`
* **API Gateway**: `http://localhost:8080`
* **Control Plane**: `http://localhost:8082`
* **Sample Backend**: `http://localhost:8081`
* **PostgreSQL**: `localhost:5433` (internal `5432`)

---

## 8. Verification and End-to-End Walkthrough

### Step 1: Create a Project
```bash
curl -s -X POST http://localhost:8082/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payments Ecosystem",
    "description": "Core payment processing APIs",
    "environment": "DEVELOPMENT"
  }' | jq .
```
*Note the returned `id` (e.g. `proj_123456789abc`).*

### Step 2: Register an Existing API
```bash
curl -s -X POST http://localhost:8082/api/projects/proj_123456789abc/apis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Payment Service",
    "upstreamBaseUrl": "http://localhost:8081",
    "environment": "DEVELOPMENT",
    "allowedMethods": ["GET", "POST"],
    "allowedPathPrefix": "/api",
    "connectTimeoutMs": 3000,
    "rateLimitRps": 100
  }' | jq .
```
*Note the returned `id` (e.g. `api_abcdef123456`).*

### Step 3: Test Upstream Connectivity
```bash
curl -s -X POST http://localhost:8082/api/apis/api_abcdef123456/test-connection | jq .
```
*Expected: `{"connectivityStatus":"CONNECTED", "latencyMs": ..., "message":"..."}`*

### Step 4: Generate an API Key
```bash
curl -s -X POST http://localhost:8082/api/apis/api_abcdef123456/keys \
  -H "Content-Type: application/json" \
  -d '{"keyName":"Production Key"}' | jq .
```
*Save the returned `apiKey` (e.g. `asp_live_...`). Note that secret key is only displayed once.*

### Step 5: Send Request Through Gateway
```bash
curl -i http://localhost:8080/proxy/api_abcdef123456/api/users \
  -H "X-API-Key: asp_live_..."
```
*Expected: Forwarded to upstream target with sanitized headers and telemetry recorded.*

### Step 6: Verify Traffic Telemetry
```bash
curl -s http://localhost:8082/api/apis/api_abcdef123456/traffic | jq .
```
*Expected: Total requests, success count, average duration, and sanitized request records.*

### Step 7: Deactivate API & Confirm Rejection
```bash
# Deactivate
curl -s -X POST http://localhost:8082/api/apis/api_abcdef123456/deactivate | jq .

# Send request again
curl -i http://localhost:8080/proxy/api_abcdef123456/api/users \
  -H "X-API-Key: asp_live_..."
```
*Expected: `HTTP 403 Forbidden` with `{"error":"API_INACTIVE"}`.*

---

## 9. Troubleshooting

* **Port Conflicts (`Address already in use`)**:
  * Default ports: Gateway `8080`, Backend `8081`, Control Plane `8082`, Frontend `3000`, PostgreSQL `5433`.
  * Override via environment variables: `export GATEWAY_PORT=8090` or `export CONTROL_PLANE_PORT=8092`.
* **Invalid or Missing API Key**:
  * Requests to `/proxy/{apiId}/**` without `X-API-Key` return `401 Unauthorized` (`MISSING_API_KEY`).
  * Ensure the key is prefixed with `asp_live_` and matches the key generated for that specific API registration.
* **SSRF Rejection**:
  * When `ALLOW_LOCAL_DEVELOPMENT=false`, all private RFC 1918 and loopback IPs are blocked. Set `ALLOW_LOCAL_DEVELOPMENT=true` in development.
