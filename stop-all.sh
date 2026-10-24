#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "🛑 Stopping ShopNex E-Commerce Demo API..."
echo "=========================================================="
cd "$BASE_DIR/shopnex-demo-api"
docker compose down

echo ""
echo "=========================================================="
echo "🛑 Stopping VEYRION Security Platform..."
echo "=========================================================="
cd "$BASE_DIR"
docker compose down

echo ""
echo "=========================================================="
echo "✅ All containers stopped cleanly."
echo "=========================================================="
