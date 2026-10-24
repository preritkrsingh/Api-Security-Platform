#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "🚀 Starting VEYRION Security Platform..."
echo "=========================================================="
cd "$BASE_DIR"
docker compose up -d

echo ""
echo "=========================================================="
echo "🛒 Starting ShopNex E-Commerce Demo API & Storefront..."
echo "=========================================================="
cd "$BASE_DIR/shopnex-demo-api"
docker compose up -d

echo ""
echo "=========================================================="
echo "✅ All Services Started Successfully!"
echo "=========================================================="
echo "• ShopNex Storefront:      http://localhost:8081"
echo "• VEYRION Security UI:     http://localhost:3000"
echo "• VEYRION Gateway Proxy:   http://localhost:8080"
echo "• VEYRION Control Plane:   http://localhost:8082"
echo "=========================================================="
