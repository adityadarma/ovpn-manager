#!/bin/bash

# Exit on error
set -e

echo "=========================================="
echo "    Building VPN Manager Docker Images  "
echo "=========================================="

# Build Manager API
echo "→ Building API Image (vpn-manager:api)..."
docker build -t vpn-manager:api -f apps/api/Dockerfile .

# Build Web Dashboard
echo "→ Building Web Image (vpn-manager:web)..."
docker build -t vpn-manager:web -f apps/web/Dockerfile .

# Build Node Agent
echo "→ Building Agent Image (vpn-manager:agent)..."
docker build -t vpn-manager:agent -f apps/agent/Dockerfile .

echo "=========================================="
echo "✅ All images built successfully!"
echo "You can now run 'docker compose up -d' without the --build flag."
echo "=========================================="
