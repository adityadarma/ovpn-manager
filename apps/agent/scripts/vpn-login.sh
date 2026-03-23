#!/bin/bash
# VPN Login Hook - Authenticates user via API
# Called by OpenVPN with auth-user-pass-verify

CRED_FILE="$1"

if [ ! -f "$CRED_FILE" ]; then
    echo "Credential file not found" >&2
    exit 1
fi

read -r USERNAME < "$CRED_FILE"
read -r PASSWORD < <(tail -n 1 "$CRED_FILE")

if [ -f "/opt/vpn-manager/.env" ]; then
    source /opt/vpn-manager/.env
else
    echo "Environment file not found" >&2
    exit 1
fi

if [ -z "$AGENT_MANAGER_URL" ] || [ -z "$VPN_TOKEN" ]; then
    echo "Missing environment variables" >&2
    exit 1
fi

NODE_ID="${AGENT_NODE_ID:-unknown}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    --max-time 10 \
    --connect-timeout 5 \
    -X POST "${AGENT_MANAGER_URL}/api/v1/vpn/auth" \
    -H "Content-Type: application/json" \
    -H "X-VPN-Token: ${VPN_TOKEN}" \
    -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\",\"node_id\":\"${NODE_ID}\"}" \
    2>&1)

if [ $? -ne 0 ]; then
    echo "API connection failed" >&2
    exit 1
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    exit 0
else
    echo "Authentication failed (HTTP $HTTP_CODE)" >&2
    exit 1
fi
