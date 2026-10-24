# Platform API Contracts

This document formalizes the HTTP REST API contracts for all services implemented and planned within the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

---

## 1. Spring Cloud Gateway

The gateway listens on port `8080` (configurable via `GATEWAY_PORT`).

### 1.1 Gateway Health Check
* **Path**: `GET /api/gateway/health` or `GET /actuator/health`
* **Description**: Returns the operational status of the gateway instance itself (does not depend on downstream status).
* **Response (200 OK)**:
```json
{
  "service": "api-gateway",
  "status": "UP",
  "timestamp": "2026-10-19T05:15:00Z"
}
```

### 1.2 Routed Request to Protected Backend
* **Path**: `GET /api/demo/resource` (sent to Gateway on port 8080)
* **Description**: Gateway forwards the request upstream to the protected sample backend (`BACKEND_URL`).
* **Upstream Response (200 OK)**:
```json
{
  "resource": "demo",
  "message": "The protected sample API is responding.",
  "status": "SUCCESS"
}
```

### 1.3 Downstream Connection Failure Handling
* **Trigger**: Upstream backend service is down or unreachable.
* **HTTP Status**: `503 Service Unavailable`
* **Response Body**:
```json
{
  "error": "DOWNSTREAM_SERVICE_UNAVAILABLE",
  "message": "The downstream protected service is temporarily unavailable or unreachable.",
  "path": "/api/demo/resource",
  "timestamp": "2026-10-19T05:15:00Z"
}
```

### 1.4 Downstream Gateway Timeout Handling
* **Trigger**: Upstream backend does not respond within `GATEWAY_RESPONSE_TIMEOUT_MS`.
* **HTTP Status**: `504 Gateway Timeout`
* **Response Body**:
```json
{
  "error": "GATEWAY_TIMEOUT",
  "message": "The downstream protected service timed out.",
  "path": "/api/demo/resource",
  "timestamp": "2026-10-19T05:15:00Z"
}
```

---

## 2. Protected Sample Backend

The sample backend listens on port `8081` (configurable via `SAMPLE_BACKEND_PORT` / `server.port`).

### 2.1 Backend Health
* **Path**: `GET /api/health`
* **Description**: Returns status of the protected sample backend.
* **Response (200 OK)**:
```json
{
  "service": "sample-backend",
  "status": "UP"
}
```

### 2.2 Demo Resource
* **Path**: `GET /api/demo/resource`
* **Description**: Returns sample protected payload to demonstrate end-to-end traffic routing.
* **Response (200 OK)**:
```json
{
  "resource": "demo",
  "message": "The protected sample API is responding.",
  "status": "SUCCESS"
}
```

---

## 3. Control Plane

The control plane listens on port `8082` (configurable via `CONTROL_PLANE_PORT` / `server.port`).

### 3.1 Control Plane Health
* **Path**: `GET /api/control/health` or `GET /actuator/health`
* **Description**: Returns operational status of the control plane.
* **Response (200 OK)**:
```json
{
  "service": "control-plane",
  "status": "UP",
  "timestamp": "2026-10-19T05:15:00Z"
}
```

### 3.2 List Security Events
* **Path**: `GET /api/v1/security-events`
* **Query Parameters**:
  * `severity` (optional): Filter by `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  * `limit` (optional, default 50): Number of events to retrieve
* **Response (200 OK)**:
```json
[
  {
    "id": "evt-7a912e44-bc92-4f32-8df2-069512345678",
    "timestamp": "2026-10-19T05:12:00Z",
    "clientIp": "192.168.1.105",
    "uriPath": "/api/demo/resource",
    "httpMethod": "GET",
    "threatType": "ANOMALOUS_VELOCITY",
    "severity": "MEDIUM",
    "riskScore": 0.65,
    "details": "Client request rate exceeded 3x normal baseline."
  }
]
```

### 3.3 Record / Ingest Security Event
* **Path**: `POST /api/v1/security-events`
* **Content-Type**: `application/json`
* **Request Body**:
```json
{
  "clientIp": "192.168.1.105",
  "uriPath": "/api/demo/resource",
  "httpMethod": "GET",
  "threatType": "ANOMALOUS_VELOCITY",
  "severity": "MEDIUM",
  "riskScore": 0.65,
  "details": "Client request rate exceeded 3x normal baseline."
}
```
* **Response (201 Created)**:
```json
{
  "id": "evt-7a912e44-bc92-4f32-8df2-069512345678",
  "timestamp": "2026-10-19T05:12:00Z",
  "clientIp": "192.168.1.105",
  "uriPath": "/api/demo/resource",
  "httpMethod": "GET",
  "threatType": "ANOMALOUS_VELOCITY",
  "severity": "MEDIUM",
  "riskScore": 0.65,
  "details": "Client request rate exceeded 3x normal baseline."
}
```
* **Validation Error Response (400 Bad Request)**:
```json
{
  "error": "VALIDATION_FAILED",
  "message": "clientIp cannot be blank, riskScore must be between 0.0 and 1.0"
}
```

---

## 4. Threat Detection Service (Phase 3 Contract)

The Python FastAPI threat detection service listens on port `8000`.

### 4.1 Threat Detection Health
* **Path**: `GET /health`
* **Response (200 OK)**:
```json
{
  "service": "threat-detection",
  "status": "UP",
  "model_loaded": true
}
```

### 4.2 Evaluate Request Telemetry
* **Path**: `POST /api/v1/detect`
* **Content-Type**: `application/json`
* **Request Body**: Conforms to `ThreatDetectionRequestMetadata` schema (`docs/api/threat-detection-metadata-schema.md`).
* **Response (200 OK)**: Conforms to `ThreatAssessmentResponse` schema.
