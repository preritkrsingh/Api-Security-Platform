#!/usr/bin/env bash
# ==============================================================================
# Script: clean-db.sh
# Purpose: Clean/wipe all database tables for the API Security Platform.
# Usage: ./scripts/clean-db.sh
# ==============================================================================

set -euo pipefail

POSTGRES_CONTAINER="platform-postgres"
DB_USER="platform_admin"
DB_NAME="api_security_platform"

echo "=========================================================="
echo " 🧹 Resetting API Security Platform Database"
echo "=========================================================="

# 1. Truncate all tables in PostgreSQL with CASCADE
echo "[1/3] Truncating PostgreSQL platform tables..."
docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "TRUNCATE TABLE traffic_records, security_events, api_keys, api_registrations, projects RESTART IDENTITY CASCADE;"

# 2. Restart control-plane to refresh Spring JPA in-memory state
if docker ps --format '{{.Names}}' | grep -q "^control-plane$"; then
  echo "[2/3] Restarting control-plane service..."
  docker restart control-plane > /dev/null
else
  echo "[2/3] control-plane container not running; skipping restart."
fi

# 3. Verify clean status
echo "[3/3] Verifying record counts in PostgreSQL..."
docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'projects' as table_name, count(*) as count from projects
UNION ALL SELECT 'api_registrations', count(*) from api_registrations
UNION ALL SELECT 'api_keys', count(*) from api_keys
UNION ALL SELECT 'traffic_records', count(*) from traffic_records
UNION ALL SELECT 'security_events', count(*) from security_events;
"

echo "=========================================================="
echo " ✅ Platform Database is 100% clean!"
echo "=========================================================="
