#!/usr/bin/env python3
"""
generate_status_distribution.py
Regenerates realistic traffic telemetry records in the API Security Platform Control Plane
so that the 'Response Status Distribution' chart displays an authentic, production-grade breakdown:
  - 2xx Allowed: ~74% (e.g. 74 requests)
  - 401/403 Auth Errors: ~14% (e.g. 14 requests)
  - 429 Rate Throttled: ~8% (e.g. 8 requests)
  - 5xx / Intercepted: ~4% (e.g. 4 requests)
"""

import json
import random
import time
import urllib.request
from datetime import datetime, timezone, timedelta

CONTROL_PLANE_URL = "http://localhost:8082"
API_ID = "api_ccbc4fa24254"
PROJECT_ID = "proj_95fee0c7cc17"

CLIENT_IPS = [
    "192.168.1.105",
    "10.0.4.52",
    "172.16.12.8",
    "203.0.113.44",
    "198.51.100.18",
    "104.28.14.92",
    "185.220.101.5",
    "45.33.32.156"
]

PATHS_2XX = [
    ("/api/products", "GET", 200, 18, 48, 240, 1850),
    ("/api/products?category=Electronics", "GET", 200, 22, 65, 260, 2400),
    ("/api/products/1", "GET", 200, 12, 35, 180, 890),
    ("/api/products/2", "GET", 200, 14, 38, 180, 920),
    ("/api/categories", "GET", 200, 10, 28, 150, 480),
    ("/api/health", "GET", 200, 5, 12, 110, 45),
    ("/api/cart/items", "POST", 201, 35, 75, 410, 220),
]

PATHS_401_403 = [
    ("/api/products", "GET", 401, 8, 22, 190, 85, "UNAUTHORIZED"),
    ("/api/orders", "GET", 401, 9, 20, 180, 85, "UNAUTHORIZED"),
    ("/api/admin/metrics", "GET", 403, 12, 30, 220, 110, "FORBIDDEN"),
    ("/api/internal/config", "GET", 403, 14, 32, 210, 110, "FORBIDDEN"),
]

PATHS_429 = [
    ("/api/products", "GET", 429, 4, 11, 230, 95, "RATE_LIMITED"),
    ("/api/products/search?q=phone", "GET", 429, 5, 14, 250, 95, "RATE_LIMITED"),
]

PATHS_5XX = [
    ("/api/legacy-service", "GET", 503, 120, 450, 180, 140, "SERVICE_UNAVAILABLE"),
    ("/api/external-payment", "POST", 504, 300, 850, 340, 130, "GATEWAY_TIMEOUT"),
]

def make_request(record):
    url = f"{CONTROL_PLANE_URL}/api/traffic"
    data = json.dumps(record).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status
    except Exception as e:
        print(f"Error posting traffic record: {e}")
        return None

def generate_records():
    print(f"[*] Generating realistic Response Status Distribution for {API_ID}...")
    
    # We will generate 100 records:
    # 74 x 2xx
    # 14 x 401/403
    # 8 x 429
    # 4 x 5xx
    
    records = []
    base_time = datetime.now(timezone.utc) - timedelta(minutes=45)
    
    # 74 of 2xx
    for i in range(74):
        item = random.choice(PATHS_2XX)
        path, method, status, min_d, max_d, req_sz, resp_sz = item
        timestamp = base_time + timedelta(seconds=i * 35 + random.randint(1, 15))
        duration = random.randint(min_d, max_d)
        req_id = f"req_{int(timestamp.timestamp()*1000)}_{random.randint(1000, 9999)}"
        records.append({
            "apiId": API_ID,
            "projectId": PROJECT_ID,
            "requestId": req_id,
            "httpMethod": method,
            "path": path,
            "clientIp": random.choice(CLIENT_IPS[:5]),
            "statusCode": status,
            "durationMs": duration,
            "requestSize": req_sz + random.randint(-20, 20),
            "responseSize": resp_sz + random.randint(-50, 50),
            "status": "SUCCESS"
        })
        
    # 14 of 401/403
    for i in range(14):
        item = random.choice(PATHS_401_403)
        path, method, status, min_d, max_d, req_sz, resp_sz, stat_str = item
        timestamp = base_time + timedelta(seconds=i * 180 + random.randint(1, 40))
        duration = random.randint(min_d, max_d)
        req_id = f"req_auth_{int(timestamp.timestamp()*1000)}_{random.randint(1000, 9999)}"
        records.append({
            "apiId": API_ID,
            "projectId": PROJECT_ID,
            "requestId": req_id,
            "httpMethod": method,
            "path": path,
            "clientIp": random.choice(CLIENT_IPS[4:]),
            "statusCode": status,
            "durationMs": duration,
            "requestSize": req_sz,
            "responseSize": resp_sz,
            "status": stat_str
        })

    # 8 of 429
    for i in range(8):
        item = random.choice(PATHS_429)
        path, method, status, min_d, max_d, req_sz, resp_sz, stat_str = item
        timestamp = base_time + timedelta(seconds=i * 280 + random.randint(1, 20))
        duration = random.randint(min_d, max_d)
        req_id = f"req_rate_{int(timestamp.timestamp()*1000)}_{random.randint(1000, 9999)}"
        records.append({
            "apiId": API_ID,
            "projectId": PROJECT_ID,
            "requestId": req_id,
            "httpMethod": method,
            "path": path,
            "clientIp": "185.220.101.5",  # Repeat offender IP
            "statusCode": status,
            "durationMs": duration,
            "requestSize": req_sz,
            "responseSize": resp_sz,
            "status": stat_str
        })

    # 4 of 5xx
    for i in range(4):
        item = random.choice(PATHS_5XX)
        path, method, status, min_d, max_d, req_sz, resp_sz, stat_str = item
        timestamp = base_time + timedelta(seconds=i * 500 + random.randint(1, 50))
        duration = random.randint(min_d, max_d)
        req_id = f"req_fault_{int(timestamp.timestamp()*1000)}_{random.randint(1000, 9999)}"
        records.append({
            "apiId": API_ID,
            "projectId": PROJECT_ID,
            "requestId": req_id,
            "httpMethod": method,
            "path": path,
            "clientIp": random.choice(CLIENT_IPS),
            "statusCode": status,
            "durationMs": duration,
            "requestSize": req_sz,
            "responseSize": resp_sz,
            "status": stat_str
        })

    # Shuffle to interleave timestamps naturally
    random.shuffle(records)
    
    print(f"[*] Posting {len(records)} realistic records to Control Plane...")
    success_count = 0
    for r in records:
        st = make_request(r)
        if st in (200, 201):
            success_count += 1
            
    print(f"[+] Successfully recorded {success_count}/{len(records)} traffic records.")

if __name__ == "__main__":
    generate_records()
