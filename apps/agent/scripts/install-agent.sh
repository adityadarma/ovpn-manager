#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# install-agent.sh — Install VPN Agent on an VPN server
# ──────────────────────────────────────────────────────────────────────────────
# Usage:
#   curl -sSL https://your-server/install-agent.sh | sudo bash
#   OR: sudo bash apps/agent/scripts/install-agent.sh
#
# Requires: Node.js 24+, pnpm (or npm)
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

AGENT_DIR="/opt/vpn-agent"
AGENT_ENV="/etc/vpn-agent/.env"
BIN_DIR="/usr/local/bin"
SERVICE_FILE="/etc/systemd/system/vpn-agent.service"

echo "🚀 Installing VPN Agent..."

# ── 1. Create directories ────────────────────────────────────────────────────
mkdir -p "$(dirname "${AGENT_ENV}")"
mkdir -p "${AGENT_DIR}"

# ── 2. Copy built agent files ────────────────────────────────────────────────
cp -r dist/ "${AGENT_DIR}/"
cp package.json "${AGENT_DIR}/"

# ── 3. Configure .env ────────────────────────────────────────────────────────
if [ ! -f "${AGENT_ENV}" ]; then
  cp .env.example "${AGENT_ENV}"
  echo "⚠️  Created ${AGENT_ENV}. Please configure it before starting the agent."
else
  echo "✓ ${AGENT_ENV} already exists — skipping"
fi

chmod 600 "${AGENT_ENV}"

# ── 4. Symlink CLI scripts to /usr/local/bin ─────────────────────────────────
for script in vpn-login vpn-connect vpn-disconnect; do
  TARGET="${BIN_DIR}/${script}"
  cat > "${TARGET}" << EOF
#!/usr/bin/env bash
VPN_ENV_PATH="${AGENT_ENV}" exec node "${AGENT_DIR}/dist/bin/${script}.js" "\$@"
EOF
  chmod +x "${TARGET}"
  echo "✓ Installed ${TARGET}"
done

# ── 5. Create systemd service for the polling agent daemon ───────────────────
cat > "${SERVICE_FILE}" << EOF
[Unit]
Description=VPN Agent — VPN Management Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${AGENT_DIR}
EnvironmentFile=${AGENT_ENV}
ExecStart=/usr/bin/node ${AGENT_DIR}/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vpn-agent

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✓ Systemd service created at ${SERVICE_FILE}"

# ── 6. Print VPN server.conf instructions ────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Installation complete!"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit ${AGENT_ENV} and set:"
echo "     AGENT_MANAGER_URL, AGENT_NODE_ID, AGENT_SECRET_TOKEN, VPN_TOKEN"
echo ""
echo "  2. Add to /etc/openvpn/server.conf:"
echo ""
echo "     # Authentication via VPN Manager"
echo "     username-as-common-name"
echo "     auth-user-pass-verify ${BIN_DIR}/vpn-login via-file"
echo "     client-connect ${BIN_DIR}/vpn-connect"
echo "     client-disconnect ${BIN_DIR}/vpn-disconnect"
echo "     script-security 2"
echo ""
echo "  3. Enable and start the agent daemon:"
echo "     systemctl enable --now vpn-agent.service"
echo ""
echo "  4. Restart VPN:"
echo "     systemctl restart openvpn@server"
echo "═══════════════════════════════════════════════════════"
