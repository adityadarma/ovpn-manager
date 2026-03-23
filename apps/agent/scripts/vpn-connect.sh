#!/bin/bash
# VPN Connect Hook - Records client connection
# Called by OpenVPN with client-connect

if [ -f "/opt/vpn-manager/.env" ]; then
    source /opt/vpn-manager/.env
else
    exit 0
fi

if [ -z "$AGENT_MANAGER_URL" ] || [ -z "$VPN_TOKEN" ]; then
    exit 0
fi

USERNAME="${common_name:-unknown}"
VPN_IP="${ifconfig_pool_remote_ip:-unknown}"
REAL_IP="${trusted_ip:-unknown}"
NODE_ID="${AGENT_NODE_ID:-unknown}"

curl -s --max-time 5 --connect-timeout 2 \
    -X POST "${AGENT_MANAGER_URL}/api/v1/vpn/connect" \
    -H "Content-Type: application/json" \
    -H "X-VPN-Token: ${VPN_TOKEN}" \
    -d "{\"username\":\"${USERNAME}\",\"vpn_ip\":\"${VPN_IP}\",\"real_ip\":\"${REAL_IP}\",\"node_id\":\"${NODE_ID}\"}" \
    > /dev/null 2>&1 &

exit 0
