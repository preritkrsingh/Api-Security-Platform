# How to Onboard and Protect Any Project with the API Security Platform

This comprehensive guide teaches you how to onboard, protect, and monitor **any external application or microservice** using the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

We use our standalone **`ecommerce`** store application as a concrete, real-world case study throughout this tutorial.

---

## 1. Architectural Principles: Zero-Code-Change Security

When adding security to an application, modern architecture dictates **separation of concerns**:

```
+-----------------------------------------------------------------------------------+
| BEFORE PLATFORM (Vulnerable / Direct Access)                                      |
|                                                                                   |
|  [ Client / Public Web ] ------------(Direct Request)------------> [ Upstream API ]|
|                                                                    (Port 8085)    |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| AFTER ONBOARDING TO PLATFORM (Shielded & Monitored)                               |
|                                                                                   |
|  [ Client / Public Web ]                                                          |
|           |                                                                       |
|           | 1. Request with X-API-Key to /proxy/{apiId}/...                       |
|           v                                                                       |
|  [ Spring Cloud Gateway : 8080 ]                                                  |
|     ├── 2. Validate Cryptographic API Key (SHA-256)                               |
|     ├── 3. Enforce Rate Limits & Allowed HTTP Methods                             |
|     ├── 4. Inspect SSRF & Path Prefix Policies                                    |
|     ├── 5. Strip X-API-Key header (Sanitize)                                      |
|     ├── 6. Forward clean request upstream -----> [ Upstream API : 8085 ]          |
|     └── 7. Async Safe Telemetry Metadata ------> [ AI Threat Detector : 8000 ]    |
|                                                  [ Control Plane DB : 8082 ]      |
+-----------------------------------------------------------------------------------+
```

### Why Your Project Should NOT Know About the Gateway

* **Decoupling**: Your service (e.g. Node.js, Spring Boot, FastAPI, Go) does not need SDKs, libraries, or hardcoded gateway URLs.
* **Security**: API keys and platform configurations are managed centrally at the gateway boundary, not leaked in client-side bundles.
* **Portability**: The service can run in local development, staging, or production without modifying its source code.

---

## 2. Onboarding Workflow Overview

Every project onboarded to the platform follows these 5 simple steps:

1. **Deploy / Run your target service** on its own port or host (e.g., `http://localhost:8085`).
2. **Create a Project Workspace** in the platform (e.g., `E-Commerce Storefront`).
3. **Register the API** with the upstream URL, path prefix, and rate limits.
4. **Mint a Cryptographic API Key** (`asp_live_...`).
5. **Route Client Traffic** through `http://localhost:8080/proxy/{apiId}/**`.

---

## 3. Hands-On Walkthrough: Protecting the E-Commerce Store

### Step 1: Start the Target Project in Standalone Mode

Our `ecommerce` application is a standalone Spring Boot 3.4 microservice running on port **8085**.

```bash
# Option A: Using the one-command service script
./ecommerce/service.sh start

# Option B: Run directly with Maven
cd ecommerce
mvn spring-boot:run
```

Verify that the e-commerce service is running and healthy on port 8085:

```bash
curl -s http://localhost:8085/health
```

Expected response:
```json
{
  "service": "ecommerce-store",
  "status": "UP",
  "version": "1.0.0",
  "timestamp": "2026-10-22T09:45:00.000Z"
}
```

Verify that the products catalog responds directly:
```bash
curl -s http://localhost:8085/api/v1/products | head -c 200
```

---

### Step 2: Ensure the Security Platform Services are Running

Start the platform services (Gateway on `8080`, Control Plane on `8082`, Threat Detector on `8000`, UI on `3000`):

```bash
# Start backend control plane & gateway
mvn spring-boot:run -pl control-plane &
mvn spring-boot:run -pl gateway &

# Start AI threat detector
cd threat-detection && ./venv/bin/uvicorn main:app --port 8000 &
```

Or run everything via Docker Compose:
```bash
docker compose up -d
```

---

### Step 3: Register the Project & API in the Platform

You can register your project either via the **Platform Web UI** (`http://localhost:3000`) or directly via the **Control Plane REST API** (`http://localhost:8082`).

#### Method A: Via Web UI (`http://localhost:3000`)
1. Open **`http://localhost:3000`** in your browser.
2. Go to **Projects** -> Click **New Project**:
   - **Name**: `E-Commerce Platform`
   - **Environment**: `DEVELOPMENT`
3. Go to **APIs & Services** -> Click **Register API**:
   - **API Name**: `Storefront REST API`
   - **Upstream Base URL**: `http://localhost:8085` (or `http://host.docker.internal:8085` if gateway is in Docker)
   - **Allowed Path Prefix**: `/api/v1`
   - **Rate Limit**: `50` requests per second
   - **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`
4. Click **Validate Upstream URL** (passes SSRF check) -> Click **Complete Registration**.

#### Method B: Via Control Plane REST API (`curl`)

1. **Create the Project Workspace**:
```bash
curl -X POST http://localhost:8082/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform",
    "description": "Production Storefront APIs and Order Services",
    "environment": "DEVELOPMENT"
  }'
```
Response:
```json
{
  "id": "proj_a1b2c3d4e5f6",
  "name": "E-Commerce Platform",
  "environment": "DEVELOPMENT",
  "createdAt": "2026-10-22T09:50:00Z"
}
```

2. **Register the API Target**:
```bash
curl -X POST http://localhost:8082/api/v1/apis \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_a1b2c3d4e5f6",
    "name": "Storefront REST API",
    "upstreamBaseUrl": "http://localhost:8085",
    "allowedPathPrefix": "/api/v1",
    "rateLimitRps": 50,
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "maxPayloadSizeBytes": 10485760
  }'
```
Response:
```json
{
  "id": "api_9876543210ab",
  "projectId": "proj_a1b2c3d4e5f6",
  "name": "Storefront REST API",
  "upstreamBaseUrl": "http://localhost:8085",
  "allowedPathPrefix": "/api/v1",
  "rateLimitRps": 50,
  "status": "ACTIVE"
}
```

---

### Step 4: Mint a Cryptographic API Key

Generate a secure credential required for client access through the gateway:

```bash
curl -X POST http://localhost:8082/api/v1/apis/api_9876543210ab/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile & Web Client Key",
    "expiresAt": null
  }'
```

Response:
```json
{
  "id": "key_445566778899",
  "name": "Mobile & Web Client Key",
  "prefix": "asp_live_5e258cb0...",
  "rawKey": "asp_live_5e258cb05d8bb61c778fb3bebd11cb3e0f0942670cde05d0c3ca6b696bd9ea3a",
  "status": "ACTIVE",
  "createdAt": "2026-10-22T09:52:00Z"
}
```

> [!IMPORTANT]
> The plaintext secret `rawKey` is only returned **once**. The control plane stores only a salted **SHA-256 hash** of the key. Store the `rawKey` safely in your environment variables or secrets manager.

---

### Step 5: Test Gateway Protection

Once registered, your upstream API is immediately accessible through Spring Cloud Gateway at:
```
http://localhost:8080/proxy/{apiId}/**
```

#### Test 1: Access without API Key (Blocked by Gateway)
```bash
curl -i http://localhost:8080/proxy/api_9876543210ab/api/v1/products
```
Response:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid API key. Header 'X-API-Key' is required."
}
```

#### Test 2: Access with Valid API Key (Success & Sanitized)
```bash
curl -i http://localhost:8080/proxy/api_9876543210ab/api/v1/products \
  -H "X-API-Key: asp_live_5e258cb05d8bb61c778fb3bebd11cb3e0f0942670cde05d0c3ca6b696bd9ea3a"
```
Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "name": "Apple iPhone 16 Pro (Natural Titanium, 128 GB)",
    "price": 119900.00,
    "stock": 45
  },
  ...
]
```

**What happened behind the scenes?**
1. The gateway verified the `X-API-Key` SHA-256 hash in <1ms.
2. The gateway **stripped** `X-API-Key` from the request so the upstream e-commerce server never sees or handles security credentials.
3. The clean request was forwarded to `http://localhost:8085/api/v1/products`.
4. The gateway captured duration, status code, and IP address, sending safe operational telemetry to the Threat Detection Engine.

---

### Step 6: Verify Runtime Security Policies

#### 1. Path Traversal & Unauthorized Prefix Blocking
Try accessing an endpoint outside the allowed `/api/v1` prefix (e.g. `/actuator` or `/admin`):
```bash
curl -i http://localhost:8080/proxy/api_9876543210ab/actuator/env \
  -H "X-API-Key: asp_live_5e258cb05d8bb61c778fb3bebd11cb3e0f0942670cde05d0c3ca6b696bd9ea3a"
```
Response:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "FORBIDDEN",
  "message": "Requested path '/actuator/env' violates allowed path prefix '/api/v1'"
}
```

#### 2. Disallowed HTTP Method Blocking
Try sending an unpermitted HTTP method (e.g. `PATCH`):
```bash
curl -i -X PATCH http://localhost:8080/proxy/api_9876543210ab/api/v1/products/1 \
  -H "X-API-Key: asp_live_5e258cb05d8bb61c778fb3bebd11cb3e0f0942670cde05d0c3ca6b696bd9ea3a"
```
Response:
```http
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json

{
  "error": "METHOD_NOT_ALLOWED",
  "message": "HTTP method 'PATCH' is not permitted for this API."
}
```

#### 3. Token-Bucket Rate Limiter
If a client sends more requests than the configured rate limit (e.g., 50 req/s):
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1

{
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Please retry after some time."
}
```

---

## 4. Onboarding ANY Project (Quick Reference Guide)

Follow this universal pattern for any project type:

| Project Type | Example Upstream URL | Path Prefix | Notes |
|---|---|---|---|
| **Python FastAPI / Flask** | `http://localhost:8000` | `/api` | Ensure CORS permits gateway or clients. |
| **Node.js Express / NestJS** | `http://localhost:5000` | `/v1` | No code modifications required. |
| **Go Gin / Fiber** | `http://localhost:8080` (remap to `:8090`) | `/api` | Keep gateway on `:8080`. |
| **Java / Spring Boot** | `http://localhost:8085` | `/api/v1` | Run standalone on designated port. |
| **Dockerized Microservice** | `http://my-service:8080` | `/api` | Join common Docker network (`platform-network`). |

### Docker Networking Tip
If your microservices run inside Docker alongside the platform:
- Connect your container to `platform-network`.
- Use the container name as the upstream host: `http://my-service:8080`.
- If running on your host machine while the gateway is in Docker, set the upstream URL to: `http://host.docker.internal:8085`.

---

## 5. Summary

By keeping the target project (`ecommerce` or any other application) completely decoupled:
1. **You make zero changes** to the application code.
2. **You obtain enterprise API security**: Cryptographic keys, rate limiting, SSRF shielding, and AI anomaly detection out of the box.
3. **You can onboard dozens of microservices** under a single unified security control plane.
