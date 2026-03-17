#!/bin/bash

# ==========================================
# Sync Node Certificates to Dashboard
# ==========================================
# This script uploads CA cert and TLS-Crypt key
# from VPN node to the VPN Manager dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================="
echo "Sync Node Certificates"
echo "================================="
echo ""

# Check if running as root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Error: This script must be run as root${NC}"
   exit 1
fi

# Configuration
MANAGER_URL="${MANAGER_URL:-}"
NODE_TOKEN="${NODE_TOKEN:-}"
CA_CERT_PATH="/etc/openvpn/server/ca.crt"
TLS_KEY_PATH="/etc/openvpn/server/tls-crypt.key"

# Check if certificates exist
if [ ! -f "$CA_CERT_PATH" ]; then
    echo -e "${RED}Error: CA certificate not found at $CA_CERT_PATH${NC}"
    echo "Please install OpenVPN server first."
    exit 1
fi

if [ ! -f "$TLS_KEY_PATH" ]; then
    echo -e "${YELLOW}Warning: TLS-Crypt key not found at $TLS_KEY_PATH${NC}"
    echo "Checking for old ta.key..."
    
    if [ -f "/etc/openvpn/server/ta.key" ]; then
        echo -e "${YELLOW}Found ta.key (old tls-auth). Consider upgrading to tls-crypt.${NC}"
        TLS_KEY_PATH="/etc/openvpn/server/ta.key"
    else
        echo -e "${RED}Error: No TLS key found. Please generate one:${NC}"
        echo "  sudo openvpn --genkey secret /etc/openvpn/server/tls-crypt.key"
        exit 1
    fi
fi

# Get configuration
if [ -z "$MANAGER_URL" ]; then
    read -p "Enter Manager URL (e.g., https://vpn.example.com): " MANAGER_URL
fi

if [ -z "$NODE_TOKEN" ]; then
    read -p "Enter Node Token (from dashboard): " NODE_TOKEN
fi

# Validate inputs
if [ -z "$MANAGER_URL" ] || [ -z "$NODE_TOKEN" ]; then
    echo -e "${RED}Error: Manager URL and Node Token are required${NC}"
    exit 1
fi

# Remove trailing slash from URL
MANAGER_URL="${MANAGER_URL%/}"

echo ""
echo "Configuration:"
echo "  Manager URL: $MANAGER_URL"
echo "  Node Token: ${NODE_TOKEN:0:10}..."
echo "  CA Cert: $CA_CERT_PATH"
echo "  TLS Key: $TLS_KEY_PATH"
echo ""

# Read certificates
echo "Reading certificates..."
CA_CERT=$(cat "$CA_CERT_PATH")
TLS_KEY=$(cat "$TLS_KEY_PATH")

if [ -z "$CA_CERT" ] || [ -z "$TLS_KEY" ]; then
    echo -e "${RED}Error: Failed to read certificate files${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Certificates read successfully${NC}"

# Prepare JSON payload
echo "Uploading to dashboard..."

# Create temporary file for JSON payload
TEMP_JSON=$(mktemp)
trap "rm -f $TEMP_JSON" EXIT

# Build JSON with proper escaping
cat > "$TEMP_JSON" <<EOF
{
  "ca_cert": $(echo "$CA_CERT" | jq -Rs .),
  "ta_key": $(echo "$TLS_KEY" | jq -Rs .)
}
EOF

# Upload to API
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NODE_TOKEN" \
  -d @"$TEMP_JSON" \
  "$MANAGER_URL/api/v1/nodes/sync-certs" 2>&1)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Certificates uploaded successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to dashboard and verify certificates are uploaded"
    echo "2. Regenerate client configs for all users"
    echo "3. Distribute new configs to clients"
    exit 0
else
    echo -e "${RED}✗ Upload failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Manager URL is correct"
    echo "2. Verify Node Token is valid"
    echo "3. Ensure node is registered in dashboard"
    echo "4. Check API logs for errors"
    exit 1
fi
