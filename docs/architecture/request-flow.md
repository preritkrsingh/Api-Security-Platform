# System Request Flow Specification

This document details the HTTP request and response lifecycles through the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

---

## 1. Phase 2 Implemented Request Flow (Current Baseline)

In Phase 2, the core gateway routing and upstream communication path are established and verified:

```mermaid
sequenceDiagram
    autonumber
    actor Client as HTTP Client
    participant GW as Spring Cloud Gateway (8080)
    participant SEC as Gateway Security Filter
    participant BE as Protected Backend (8081)

    Client->>GW: GET /api/demo/resource
    Note over GW: Route Predicate: Path=/api/**
    GW->>SEC: Execute Pre-Routing Filters
    Note over SEC: Capture metadata (Method, Path, Client IP)<br/>Sanitize logs (Exclude secrets)
    SEC->>BE: Forward to Upstream (http://localhost:8081/api/demo/resource)
    BE-->>SEC: 200 OK ({"resource":"demo", "status":"SUCCESS"})
    Note over SEC: Record latency & response status
    SEC-->>GW: Return response
    GW-->>Client: 200 OK with JSON payload
```

### Detailed Execution Steps:
1. **Client Request**: The HTTP client sends a request to the API Gateway at port `8080` (e.g., `GET /api/demo/resource`).
2. **Route Matching**: The Spring Cloud Gateway route locator evaluates route predicates. The `/api/**` predicate matches the request.
3. **Pre-Filtering & Security Sanitization**:
   - The Gateway executes global filters.
   - Request metadata is extracted (HTTP method, normalized URI path, client remote IP, content length).
   - Sensitive headers (`Authorization`, `Cookie`, `X-API-Key`) and request bodies are strictly excluded from logging.
4. **Upstream Forwarding**: The Gateway's Netty HTTP client opens a connection to the configured backend URL (`BACKEND_URL`, default `http://localhost:8081`) and transmits the request.
5. **Backend Processing**: The protected sample backend's `ApiController` handles the request and returns a structured JSON response (`200 OK`).
6. **Post-Filtering**: The Gateway completes latency measurements, logs the access record (safe metadata only), and streams the response back to the client.

---

## 2. Resilience & Error Handling Flows

### 2.1 Upstream Down / Connection Failure
```mermaid
sequenceDiagram
    actor Client as HTTP Client
    participant GW as Spring Cloud Gateway (8080)
    participant BE as Protected Backend (Down)

    Client->>GW: GET /api/demo/resource
    GW->>BE: Connect to http://localhost:8081
    BE--xGW: Connection Refused / Host Unreachable
    Note over GW: Exception caught by Gateway Error Handler
    GW-->>Client: 503 Service Unavailable<br/>{"error": "DOWNSTREAM_SERVICE_UNAVAILABLE", ...}
```

When the upstream service is offline, the gateway intercepts the `ConnectException` or `AnnotatedConnectException` and returns a clean, structured `503 Service Unavailable` JSON response rather than dropping the socket or exposing internal Java stack traces.

### 2.2 Upstream Timeout Handling
```mermaid
sequenceDiagram
    actor Client as HTTP Client
    participant GW as Spring Cloud Gateway (8080)
    participant BE as Protected Backend (Stalled)

    Client->>GW: GET /api/demo/resource
    GW->>BE: Forward request
    Note over GW: Timer exceeds GATEWAY_RESPONSE_TIMEOUT_MS (5000ms)
    BE--xGW: No response received
    GW-->>Client: 504 Gateway Timeout<br/>{"error": "GATEWAY_TIMEOUT", ...}
```

If the upstream backend fails to respond within the configured timeout window (`GATEWAY_RESPONSE_TIMEOUT_MS`), the gateway terminates the upstream socket and returns a clean `504 Gateway Timeout` JSON response.

---

## 3. Future Integrated Threat Assessment Flow (Phase 3 & 4)

In later phases, the threat detection engine and control plane are actively engaged:

```mermaid
sequenceDiagram
    autonumber
    actor Client as HTTP Client
    participant GW as Spring Cloud Gateway
    participant TD as Threat Detection Service (FastAPI)
    participant CP as Control Plane (Spring Boot)
    participant BE as Protected Backend

    Client->>GW: HTTP Request
    GW->>GW: Extract Request Metadata (No Payload)
    par Threat Evaluation
        GW->>TD: POST /api/v1/detect (Metadata)
        TD-->>GW: RiskScore (0.0 - 1.0), RecommendedAction
    and Policy Check
        GW->>GW: Evaluate Thresholds
    end
    alt Risk < Threshold (Normal)
        GW->>BE: Forward Request
        BE-->>GW: Upstream Response
        GW-->>Client: HTTP Response
    else High Risk Detected (Anomaly)
        GW->>CP: POST /api/v1/security-events (Audit)
        GW-->>Client: 429 Too Many Requests or 403 Forbidden
    end
```
