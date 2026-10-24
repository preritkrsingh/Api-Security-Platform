# 🚀 How to Run the Complete VEYRION & ShopNex Platform

This guide provides step-by-step instructions for running the **VEYRION AI-Based API Security Platform** and the **ShopNex Enterprise E-Commerce Storefront**.

---

## 📌 Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Browser / Client                 │
                      │   ShopNex Storefront: http://localhost:8081   │
                      │   VEYRION Dashboard:  http://localhost:3000   │
                      └──────────────────────┬────────────────────────┘
                                             │
                       Requests with X-API-Key Header
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │        VEYRION API Security Gateway           │
                      │             Port: 8080                        │
                      │  • Token-Bucket Rate Limiting                 │
                      │  • Cryptographic Key Validation (SHA-256)     │
                      │  • Threat Detection & Audit Logging           │
                      └──────────────────────┬────────────────────────┘
                                             │
                        Proxied upstream via host.docker.internal:8081
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │             ShopNex Demo API                  │
                      │             Port: 8081                        │
                      │  • Spring Boot 3.4 & Java 21                  │
                      │  • Amazon / Flipkart E-Commerce Storefront    │
                      │  • PostgreSQL 16 (Port 5436)                  │
                      └───────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (2 Commands)

Open your terminal and run:

### Step 1: Start VEYRION Security Platform
```bash
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform
docker compose up -d
```
*Starts PostgreSQL (`:5435`), Control Plane (`:8082`), API Gateway (`:8080`), and Platform UI (`:3000`).*

### Step 2: Start ShopNex E-Commerce Storefront
```bash
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/shopnex-demo-api
docker compose up -d
```
*Starts ShopNex PostgreSQL (`:5436`) and ShopNex Storefront & API (`:8081`).*

---

## 🌐 Port Mapping & Service URLs

| Service Name | Port | URL | Description |
| :--- | :--- | :--- | :--- |
| **ShopNex Storefront** | `8081` | [http://localhost:8081](http://localhost:8081) | Amazon/Flipkart E-Commerce storefront |
| **ShopNex Health** | `8081` | [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health) | Target backend health status |
| **VEYRION Gateway** | `8080` | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Security Gateway proxy entrypoint |
| **VEYRION Dashboard** | `3000` | [http://localhost:3000](http://localhost:3000) | Live threat analysis & metrics UI |
| **VEYRION Control Plane** | `8082` | [http://localhost:8082/actuator/health](http://localhost:8082/actuator/health) | API management & rule engine |
| **Platform DB** | `5435` | `localhost:5435` | VEYRION PostgreSQL 16 |
| **ShopNex DB** | `5436` | `localhost:5436` | ShopNex PostgreSQL 16 |

---

## 🛠️ Step-by-Step Guide: Connecting ShopNex to VEYRION

If you ever need to reconnect or register a fresh API route in the VEYRION Gateway, follow these steps:

### 1. Register ShopNex in VEYRION
1. Open the VEYRION Dashboard: [http://localhost:3000](http://localhost:3000)
2. Go to **APIs** → **Register New API**
3. Fill in the form:
   - **API Name**: `ShopNex E-Commerce API`
   - **Target Upstream URL**: `http://host.docker.internal:8081`
     *(Important: Use `host.docker.internal` so Docker containers can reach the host machine port 8081)*
   - **Rate Limit**: `100` req/min (or your preferred threshold)
4. Click **Save**. Note down the generated **API ID** (e.g., `api_ccbc4fa24254`).

### 2. Generate an API Key
1. In the VEYRION Dashboard, go to **API Keys** → **Generate Key**.
2. Select your registered ShopNex API.
3. Copy the raw API key (e.g., `asp_live_f9c9a0...`).

### 3. Connect the Frontend
Open `shopnex-demo-api/src/main/resources/static/js/api.js`:
```javascript
// 1. Point to your VEYRION Gateway proxy route:
const BASE_URL = 'http://localhost:8080/proxy/YOUR_API_ID';

// 2. Insert your secret API key:
const API_KEY = 'YOUR_GENERATED_API_KEY';
```

### 4. Rebuild the ShopNex Container
Whenever you modify frontend or backend files in `shopnex-demo-api`:
```bash
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/shopnex-demo-api
mvn clean package -DskipTests
docker compose up --build -d shopnex-api
```

---

## ✅ Verifying the Installation

### 1. Test Gateway Proxy via cURL
Run this command from your terminal:
```bash
curl -i -H "X-API-Key: YOUR_GENERATED_API_KEY" \
  "http://localhost:8080/proxy/YOUR_API_ID/api/products?size=5"
```
**Expected response**: `HTTP/1.1 200 OK` with JSON array of products.

### 2. Test Rate Limiting / Security Guard
Send requests rapidly or without an API key:
```bash
curl -i "http://localhost:8080/proxy/api_ccbc4fa24254/api/products"
```
**Expected response**: `HTTP/1.1 401 Unauthorized` or `429 Too Many Requests`. The event will instantly show up on the VEYRION Dashboard (`http://localhost:3000`)!

### 3. Open the Storefront
Navigate to **[http://localhost:8081](http://localhost:8081)**:
- Log in using one-click demo credentials (`Alice Vance`, `Bob Martin`, or `Charlie Davis`).
- Add items to your cart or use **"Buy Now"** for 1-click checkout.
- Watch live analytics and security tokens update in the VEYRION Dashboard.

---

## 💻 Daily Development Commands

### Viewing Logs
```bash
# VEYRION Gateway logs
docker logs -f api-gateway

# VEYRION Control Plane logs
docker logs -f control-plane

# ShopNex E-Commerce logs
docker logs -f shopnex-demo-api
```

### Stopping Services
```bash
# Stop ShopNex
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/shopnex-demo-api
docker compose down

# Stop VEYRION Platform
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform
docker compose down
```

### Restarting Everything Fresh
```bash
# Stop and remove all containers
docker stop api-gateway control-plane platform-frontend platform-postgres shopnex-demo-api shopnex-postgres
docker rm api-gateway control-plane platform-frontend platform-postgres shopnex-demo-api shopnex-postgres

# Start VEYRION
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform
docker compose up -d

# Start ShopNex
cd /home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/shopnex-demo-api
docker compose up -d
```

---

## ❓ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Invalid CORS request / 403 Forbidden"** | Already resolved in `WebConfig.java` with `.allowedOriginPatterns("*")`. If running fresh, ensure ShopNex has the latest code. |
| **"Connection refused: host.docker.internal:8081"** | Ensure `docker-compose.yml` has `extra_hosts: ["host.docker.internal:host-gateway"]` on `gateway` and `control-plane`. |
| **Browser shows stale CSS / JS** | Press **`Ctrl + Shift + R`** (or **`Cmd + Shift + R`** on Mac) to force a hard cache reload in your browser. |
| **Port Conflict on 5432** | VEYRION runs on host port `5435`, and ShopNex runs on host port `5436`. Neither conflicts with local system PostgreSQL on `5432`. |
