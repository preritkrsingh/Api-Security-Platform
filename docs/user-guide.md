# Beginner-Friendly User Guide: How to Use the Platform

Welcome to the **AI-Based API Security Threat Detection and Risk Assessment Platform**. This guide explains how to start, configure, test, and monitor your APIs in simple English.

---

## A. What is this platform?

This platform is a **security shield for web APIs**.

An **API** (Application Programming Interface) allows web browsers and mobile apps to talk to backend servers. For example, when you tap "Checkout" on an e-commerce website, the app calls an API to process your order.

When an API is connected to the internet, attackers may attempt to:
- Flood it with thousands of requests per second (DDoS / volumetric abuse).
- Guess passwords using automated bots (credential stuffing).
- Probe for hidden or administrative endpoints (fuzzing and scanning).
- Read files they do not own (BOLA / IDOR).

Instead of exposing your backend server directly to the public internet, you place this **Spring Cloud Gateway** in front of it. The gateway inspects every request, validates cryptographic API keys, enforces rate limits, stops internal network probing (SSRF), and sends privacy-safe telemetry to a **Python AI Engine** that detects anomalies.

---

## B. Before you start

Before opening the platform, verify that the required microservices are running.

### 1. Port Allocation

| Service | Port | Description |
|---|:---:|---|
| **Platform Frontend** | `3000` | Web user interface for managing APIs and viewing traffic |
| **API Security Gateway** | `8080` | Reverse proxy that intercepts and validates client traffic |
| **Sample Protected Backend** | `8081` | Safe demonstration API used for testing |
| **Control Plane** | `8082` | Management service storing projects, APIs, and credentials |
| **AI Threat Detection Engine** | `8000` | Python FastAPI service with Isolation Forest ML model |
| **PostgreSQL Database** | `5435` | Persistent relational database (or in-memory H2 in dev mode) |

### 2. How to Start Everything with Docker Compose

Open your terminal in the project directory and run:

```bash
docker compose up --build -d
```

Verify that all containers are healthy:

```bash
docker compose ps
```

Once running, open your web browser and navigate to:
**`http://localhost:3000`**

### 3. What to do if a service is unavailable
- If port `8080` or `8082` is already in use by another program, stop the conflicting program or edit `.env` to assign a different port.
- Open **Settings** in the left sidebar and click **Run Diagnostics** to verify connectivity to all 4 microservices.

---

## C. How to create your first project

A **Project** is a workspace where you group related APIs. For example, you might create one project for your development environment and another for production.

1. Open **`http://localhost:3000`** in your browser.
2. In the left sidebar, click **Projects**.
3. In the top-right corner, click **New Project**.
4. In the modal that appears:
   - Enter a **Project Name** (for example: `E-Commerce Storefront`).
   - Enter a brief **Description** (for example: `Customer and order APIs`).
   - Choose the **Environment** (`DEVELOPMENT`, `TESTING`, or `PRODUCTION`).
5. Click **Create Project**.

**What success looks like:** A new project card appears on the screen with an ID like `proj_...`. The platform automatically selects this project as your active workspace.

---

## D. How to register an API

Registering an API tells the gateway which backend server to protect.

1. In the left sidebar, click **APIs & Services**.
2. Click the purple **Register API** button in the top right to start the 6-step wizard.
3. **Step 1 (Project):** Confirm your active project is selected, then click **Continue**.
4. **Step 2 (API Details):**
   - **API Name:** Enter a friendly name, such as `Product Catalog API`.
   - **Upstream Base URL:** Enter the address of the backend service you want to protect.
     > **What is an Upstream URL?**  
     > The upstream URL is the private network address of your backend server (for example, `http://localhost:8081` for the sample backend, or `http://sample-backend:8081` inside Docker).  
     > **Important:** Do not enter arbitrary external websites (like `https://google.com`). You should only register backend APIs that you own and have permission to protect.
   - **Allowed Path Prefix:** Keep the default `/api` (or `/api/v1`).
   - **Rate Limit:** Set how many requests per second one client can send (default: `100`).
   - Click **Continue**.
5. **Step 3 (SSRF Validation):** Click **Validate Upstream URL**. The system verifies that the URL uses HTTP/HTTPS and does not probe dangerous cloud metadata endpoints (`169.254.169.254`).
6. **Step 4 (Review):** Review your settings and click **Complete Registration**.

---

## E. How to use the gateway (Sending Requests)

Once registered, your API is protected behind Spring Cloud Gateway.

### 1. Your Gateway URL

The gateway assigns a dedicated route to your API using its unique ID:
```
http://localhost:8080/proxy/{apiId}/...
```
For example, if your API ID is `api_69091e855637`, all client requests must go to:
```
http://localhost:8080/proxy/api_69091e855637/api/demo/resource
```

### 2. Generate Your API Key

Clients must send an `X-API-Key` header with each request:

1. In **APIs & Services**, click the **Key** icon next to your registered API.
2. Click **Mint Key**.
3. **Important:** Copy the generated secret key (it looks like `asp_live_...`). For security, the plaintext secret is shown only once; only its one-way SHA-256 hash is saved.

### 3. Send a Request with cURL

Open your terminal and run:

```bash
curl -i http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource \
  -H "X-API-Key: YOUR_API_KEY"
```

Replace `YOUR_API_ID` and `YOUR_API_KEY` with your actual values.

### 4. What success looks like:
You will receive `HTTP/1.1 200 OK`:
```json
{
  "resource": "demo",
  "message": "The protected sample API is responding.",
  "status": "SUCCESS"
}
```

The gateway stripped the `X-API-Key` header before passing the request to the upstream backend, keeping the credential safe from upstream leakage.

---

## F. How to monitor traffic

1. In the left sidebar, click **Traffic Monitoring**.
2. Notice that the request you just sent appears in the table.
3. The table displays:
   - **Timestamp:** Exactly when the request arrived.
   - **API Target:** The registered API name.
   - **Method:** `GET`, `POST`, `PUT`, `DELETE`.
   - **URI Path:** The requested path (e.g. `/api/demo/resource`).
   - **Client IP:** Proximate IP address of the caller.
   - **HTTP Status:** Green `200` for success, yellow `401` or `429` for blocked calls.
   - **Latency:** Roundtrip duration in milliseconds.
4. **Privacy Protection:** Notice that passwords, authorization tokens, cookies, and request bodies are never displayed or stored in logs.
5. You can filter by API ID or by HTTP status (`2xx Success`, `4xx Blocked`).

---

## G. How to understand security alerts

In the left sidebar, click **Threat Detection**.

Here is what each alert type means:

| Event Type | What Happened | Was it Blocked? |
|---|---|:---:|
| **Normal Request (200 OK)** | Legitimate request with valid key and normal rate. | No (Allowed) |
| **Missing / Invalid Key (401)** | A caller sent a request without an `X-API-Key` or with a revoked key. | **Yes (Blocked)** |
| **Path Forbidden (403)** | A caller attempted to access a path outside the allowed prefix (e.g. `/admin`). | **Yes (Blocked)** |
| **Method Not Allowed (405)** | A caller used a disallowed verb (e.g. `DELETE` on a read-only endpoint). | **Yes (Blocked)** |
| **Rate Limit Exceeded (429)** | A caller sent requests faster than the configured RPS limit. | **Yes (Throttled)** |
| **AI Statistical Anomaly** | The Isolation Forest model detected unusual path depth or scanner User-Agent. | Logged / Throttled |

> **Note on Anomaly Detection:**  
> An "anomaly" means a request looked unusual compared to normal traffic. It does not always mean an attack occurred. The platform separates anomaly indicators from automated blocking to prevent disrupting real users.

---

## H. How to test the platform (7 Step-by-Step Test Scenarios)

You can run these safe tests locally to verify platform security:

### Scenario 1: Legitimate Authorized Request (Passes)
```bash
curl -i http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource \
  -H "X-API-Key: YOUR_API_KEY"
```
*Outcome:* `HTTP 200 OK`. Request is recorded as `SUCCESS` in Traffic Monitoring.

---

### Scenario 2: Missing API Key (Blocked at Perimeter)
```bash
curl -i http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource
```
*Outcome:* `HTTP 401 Unauthorized` with `{"error": "MISSING_API_KEY"}`.

---

### Scenario 3: Forged / Invalid API Key (Blocked)
```bash
curl -i http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource \
  -H "X-API-Key: asp_live_fakecredentials12345678"
```
*Outcome:* `HTTP 401 Unauthorized` with `{"error": "INVALID_API_KEY"}`.

---

### Scenario 4: Disallowed HTTP Method (Enforced)
```bash
curl -i -X DELETE http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource \
  -H "X-API-Key: YOUR_API_KEY"
```
*Outcome:* `HTTP 405 Method Not Allowed` with `{"error": "METHOD_NOT_ALLOWED"}`.

---

### Scenario 5: Unauthorized Path Prefix (Blocked)
```bash
curl -i http://localhost:8080/proxy/YOUR_API_ID/secret/admin/passwords \
  -H "X-API-Key: YOUR_API_KEY"
```
*Outcome:* `HTTP 403 Forbidden` with `{"error": "PATH_PREFIX_FORBIDDEN"}`.

---

### Scenario 6: Rate Limiting Burst Test (Exhausts Token Bucket)
Send 20 rapid concurrent requests in your terminal:
```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/proxy/YOUR_API_ID/api/demo/resource -H "X-API-Key: YOUR_API_KEY"
done
```
*Outcome:* Initial requests return `200`, followed by `429 Too Many Requests` (`RATE_LIMIT_EXCEEDED`).

---

### Scenario 7: SSRF Protection Test (Blocked During Registration)
Attempt to register an API pointing to cloud instance metadata:
```bash
curl -s -X POST http://localhost:8082/api/projects/YOUR_PROJECT_ID/apis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Malicious Metadata Probe",
    "upstreamBaseUrl": "http://169.254.169.254",
    "environment": "DEVELOPMENT"
  }'
```
*Outcome:* Rejected with `400 Bad Request`: `Access to cloud metadata endpoints is strictly forbidden (SSRF Protection).`

---

## I. Common problems and solutions

### 1. "Gateway returns 404 API_NOT_FOUND"
- **Cause:** The API ID in your URL does not exist or was deleted.
- **Solution:** Go to **APIs & Services**, copy the exact `api_...` ID, and update your URL.

### 2. "Gateway returns 503 DOWNSTREAM_SERVICE_UNAVAILABLE"
- **Cause:** The backend server at the upstream URL is stopped or unreachable.
- **Solution:** Verify that your target backend is running. For the sample backend, check `http://localhost:8081/actuator/health`.

### 3. "Gateway returns 401 UNAUTHORIZED"
- **Cause:** You did not include the `X-API-Key` header, or you used a revoked key.
- **Solution:** Go to **APIs & Services**, click the **Key** icon, and generate a new key.

### 4. "Traffic does not appear in Traffic Monitoring"
- **Cause:** Requests sent directly to port `8081` bypass the gateway.
- **Solution:** Ensure you are sending requests to port `8080` via `/proxy/{apiId}/**`. Only traffic through the gateway is monitored.

### 5. "Python Threat Detector is OFFLINE"
- **Cause:** The FastAPI service on port 8000 is not started.
- **Solution:** Run `./threat-detection/venv/bin/python threat-detection/main.py` or `docker compose up -d threat-detection`.

---

## J. Quick-Start Checklist

Follow this checklist to go from zero to a verified gateway request in 5 minutes:

- [ ] 1. Start all services: `docker compose up -d` (or run `./threat-detection/venv/bin/python threat-detection/main.py` and `mvn spring-boot:run` in each service directory).
- [ ] 2. Open `http://localhost:3000` in your browser.
- [ ] 3. Open **Settings** and click **Run Diagnostics** to confirm all services are green.
- [ ] 4. Go to **Projects** and click **New Project** (e.g. `Demo Project`).
- [ ] 5. Go to **APIs & Services** and click **Register API**:
  - Name: `Sample Backend`
  - Upstream URL: `http://localhost:8081` (or `http://sample-backend:8081` in Docker)
- [ ] 6. Complete the wizard and copy your newly generated `asp_live_...` API Key.
- [ ] 7. In **APIs & Services**, click **Test** on your API to open the Interactive Console.
- [ ] 8. Paste your API key, click **Send Request**, and verify `HTTP 200 OK`.
- [ ] 9. Go to **Traffic Monitoring** to see your live request record.
