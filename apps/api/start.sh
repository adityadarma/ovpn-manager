#!/bin/sh
set -e

echo "=========================================="
echo "    Running Database Migrations...        "
echo "=========================================="
cd /app
tsx node_modules/@ovpn/db/src/migrate.ts

echo "=========================================="
echo "    Running Database Seeders...           "
echo "=========================================="
tsx node_modules/@ovpn/db/src/seed.ts

echo "=========================================="
echo "    Starting API Backend...               "
echo "=========================================="
exec node dist/index.js
