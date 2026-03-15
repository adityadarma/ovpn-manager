#!/bin/bash

# Exit on error
set -e

echo "=========================================="
echo "    Building OpenVPN Manager Docker Images  "
echo "=========================================="

# Build Manager API
echo "→ Building API Image (ovpn-manager:api)..."
docker build -t ovpn-manager:api -f apps/api/Dockerfile .

# Build Web Dashboard
echo "→ Building Web Image (ovpn-manager:web)..."
docker build -t ovpn-manager:web -f apps/web/Dockerfile .

# Build Node Agent
echo "→ Building Agent Image (ovpn-manager:agent)..."
docker build -t ovpn-manager:agent -f apps/agent/Dockerfile .

echo "=========================================="
echo "✅ All images built successfully!"
echo "You can now run 'docker compose up -d' without the --build flag."
echo "=========================================="
