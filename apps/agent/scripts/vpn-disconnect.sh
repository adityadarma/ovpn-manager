#!/bin/bash
# VPN Disconnect Hook - Records client disconnection
# Called by OpenVPN with client-disconnect

if [ -f "/opt/vpn-manager/.env" ]; then
    source /opt/vpn-manager/.env
else
    exit 0
fi

if [ -z "$AGENT_MANAGER_URL" ] || [ -z "$VPN_TOKEN" ]; then
    exit 0
fi

USERNAME="${common_name:-unknown}"
NODE_ID="${AGENT_NODE_ID:-unknown}"
BYTES_SENT="${bytes_sent:-0}"
BYTES_RECEIVED="${bytes_received:-0}"

curl -s --max-time 5 --connect-timeout 2 \
    -X POST "${AGENT_MANAGER_URL}/api/v1/vpn/disconnect" \
    -H "Content-Type: application/json" \
    -H "X-VPN-Token: ${VPN_TOKEN}" \
    -d "{\"username\":\"${USERNAME}\",\"node_id\":\"${NODE_ID}\",\"bytes_sent\":${BYTES_SENT},\"bytes_received\":${BYTES_RECEIVED}}" \
    > /dev/null 2>&1 &

exit 0
