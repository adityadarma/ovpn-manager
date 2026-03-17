# Certificate Synchronization Guide

This guide explains how to sync CA certificates and TLS keys from VPN nodes to the OVPN Manager dashboard.

## Why Sync Certificates?

When you setup a new VPN node or regenerate certificates, the dashboard needs to know about them to generate correct client configs. Without syncing:

- ❌ Client configs will have wrong/missing certificates
- ❌ Clients cannot connect (TLS authentication fails)
- ❌ Error: "tls-crypt unwrap error: packet authentication failed"

## Methods

There are 3 ways to sync certificates:

### Method 1: Manual Script (Recommended for Initial Setup)

Use the sync script on the VPN node server:

```bash
# On VPN node server
sudo bash /path/to/scripts/sync-node-certs.sh
```

**Interactive prompts:**
- Manager URL: `https://your-dashboard.com`
- Node Token: Get from Dashboard → Nodes → View Token

**What it does:**
1. Reads `/etc/openvpn/server/ca.crt`
2. Reads `/etc/openvpn/server/tls-crypt.key` (or `ta.key`)
3. Uploads to dashboard via API
4. Updates node record in database

### Method 2: Agent Task (Automated)

Trigger sync from the dashboard:

```bash
# Via API
curl -X POST https://your-dashboard.com/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "node-uuid-here",
    "action": "sync_certificates",
    "payload": {}
  }'
```

**Or from dashboard UI:**
1. Go to Nodes → Select Node
2. Click "Sync Certificates" button
3. Wait for task to complete

### Method 3: Manual Upload (Dashboard)

If you have access to the server files:

1. **Get certificates from server:**
   ```bash
   # SSH to VPN node
   sudo cat /etc/openvpn/server/ca.crt
   sudo cat /etc/openvpn/server/tls-crypt.key
   ```

2. **Upload via dashboard:**
   - Go to Nodes → Select Node → Edit
   - Paste CA cert into "CA Certificate" field
   - Paste TLS key into "TLS Key" field
   - Click Save

## When to Sync

Sync certificates when:

- ✅ **New node setup** - After installing OpenVPN server
- ✅ **Certificate regeneration** - After running `easyrsa` commands
- ✅ **TLS key rotation** - Security best practice (annually)
- ✅ **Upgrade tls-auth → tls-crypt** - After migration
- ✅ **Connection errors** - If clients get TLS authentication failures

## Verification

After syncing, verify:

### 1. Check Dashboard

```bash
# Via API
curl https://your-dashboard.com/api/v1/nodes/NODE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should show:
# "ca_cert": "-----BEGIN CERTIFICATE-----..."
# "ta_key": "-----BEGIN OpenVPN Static key V1-----..."
```

### 2. Test Client Config

```bash
# Download new client config
# Dashboard → Users → Select User → Download Config

# Check it contains correct certificates
grep -A 5 "<ca>" user.ovpn
grep -A 5 "<tls-crypt>" user.ovpn
```

### 3. Test Connection

```bash
# Try connecting with new config
openvpn --config user.ovpn

# Should connect without TLS errors
```

## Troubleshooting

### Error: "CA certificate not found"

```bash
# Check if OpenVPN is installed
ls -la /etc/openvpn/server/

# If missing, install OpenVPN first
sudo bash scripts/vpn-server.sh install
```

### Error: "TLS key not found"

```bash
# Check for tls-crypt key
ls -la /etc/openvpn/server/tls-crypt.key

# If not found, generate it
sudo openvpn --genkey secret /etc/openvpn/server/tls-crypt.key

# Update server config
sudo nano /etc/openvpn/server/server.conf
# Add: tls-crypt /etc/openvpn/server/tls-crypt.key

# Restart
sudo systemctl restart openvpn-server@server.service
```

### Error: "Invalid certificate format"

The API validates certificate format. Ensure:

- CA cert contains `-----BEGIN CERTIFICATE-----`
- TLS key contains `-----BEGIN OpenVPN Static key V1-----`
- No extra spaces or characters
- Complete file (not truncated)

### Error: "Node token invalid"

```bash
# Get correct token from dashboard
# Dashboard → Nodes → Select Node → View Token

# Or via API (admin token required)
curl https://your-dashboard.com/api/v1/nodes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Sync succeeds but clients still can't connect

1. **Regenerate client configs:**
   ```bash
   # All users need NEW configs after cert sync
   # Dashboard → Users → Download Config (for each user)
   ```

2. **Check server is using new certs:**
   ```bash
   sudo systemctl restart openvpn-server@server.service
   sudo tail -f /var/log/openvpn.log
   ```

3. **Verify client imported new config:**
   - Delete old config from OpenVPN client
   - Import freshly downloaded config
   - Try connecting again

## Automation

### Auto-sync on Agent Start

The agent can automatically sync certificates on startup:

```bash
# Edit agent config
sudo nano /etc/systemd/system/ovpn-agent.service

# Add environment variable
Environment="AUTO_SYNC_CERTS=true"

# Restart agent
sudo systemctl restart ovpn-agent
```

### Periodic Sync (Cron)

```bash
# Add to crontab
sudo crontab -e

# Sync daily at 2 AM
0 2 * * * /path/to/scripts/sync-node-certs.sh > /var/log/cert-sync.log 2>&1
```

### Sync After Certificate Renewal

```bash
# Hook into cert renewal process
# Add to /etc/openvpn/easy-rsa/post-renew.sh

#!/bin/bash
/path/to/scripts/sync-node-certs.sh
```

## Security Considerations

### Certificate Protection

- ✅ Certificates are transmitted over HTTPS
- ✅ Node token required for authentication
- ✅ Only node can update its own certificates
- ✅ Admin can view but not modify via API

### Token Security

```bash
# Store token securely
sudo chmod 600 /etc/ovpn-agent/.env
sudo chown root:root /etc/ovpn-agent/.env

# Rotate tokens periodically
# Dashboard → Nodes → Regenerate Token
```

### Audit Trail

All certificate syncs are logged:

```bash
# Check API logs
docker logs ovpn-manager-api | grep "sync-certs"

# Check agent logs
sudo journalctl -u ovpn-agent | grep "sync-certs"
```

## Best Practices

1. ✅ **Sync immediately after node setup**
2. ✅ **Verify sync before distributing client configs**
3. ✅ **Keep backup of certificates**
4. ✅ **Document which nodes use which certificates**
5. ✅ **Test connection after every sync**
6. ✅ **Rotate certificates annually**
7. ✅ **Monitor sync failures**

## API Reference

### POST /api/v1/nodes/sync-certs

Sync node certificates to dashboard.

**Authentication:** Node token (Bearer)

**Request:**
```json
{
  "ca_cert": "-----BEGIN CERTIFICATE-----\n...",
  "ta_key": "-----BEGIN OpenVPN Static key V1-----\n..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificates synced successfully",
  "node_id": "uuid"
}
```

**Errors:**
- `400` - Invalid certificate format
- `401` - Invalid node token
- `500` - Server error

## Examples

### Example 1: New Node Setup

```bash
# 1. Install OpenVPN
sudo bash scripts/vpn-server.sh install

# 2. Install agent
sudo bash scripts/install-agent.sh

# 3. Sync certificates
sudo bash scripts/sync-node-certs.sh

# 4. Verify in dashboard
# Dashboard → Nodes → Check certificates are uploaded

# 5. Generate client config
# Dashboard → Users → Download Config

# 6. Test connection
```

### Example 2: Certificate Rotation

```bash
# 1. Backup old certificates
sudo cp -r /etc/openvpn/server /etc/openvpn/server.backup

# 2. Generate new certificates
cd /etc/openvpn/easy-rsa
sudo ./easyrsa build-ca
sudo ./easyrsa build-server-full server nopass
sudo openvpn --genkey secret /etc/openvpn/server/tls-crypt.key

# 3. Update server config (if needed)
sudo systemctl restart openvpn-server@server.service

# 4. Sync to dashboard
sudo bash scripts/sync-node-certs.sh

# 5. Regenerate ALL client configs
# Dashboard → Users → Download Config (for each)

# 6. Distribute new configs to users
```

### Example 3: Multi-Node Deployment

```bash
# Option A: Unique certs per node (recommended)
# On each node:
sudo bash scripts/vpn-server.sh install
sudo bash scripts/sync-node-certs.sh

# Option B: Shared certs (simpler)
# On first node:
sudo openvpn --genkey secret /tmp/shared-tls-crypt.key

# Copy to other nodes:
scp /tmp/shared-tls-crypt.key root@node2:/etc/openvpn/server/tls-crypt.key
scp /tmp/shared-tls-crypt.key root@node3:/etc/openvpn/server/tls-crypt.key

# Sync from any node:
sudo bash scripts/sync-node-certs.sh
```

## Support

For issues:
1. Check logs: `sudo tail -f /var/log/openvpn.log`
2. Verify certificates exist on server
3. Test API endpoint manually
4. Check dashboard for error messages
5. Open GitHub issue with logs
