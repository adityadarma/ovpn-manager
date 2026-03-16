export interface VpnSession {
  id: string
  user_id: string
  node_id: string
  vpn_ip: string
  bytes_sent: number
  bytes_received: number
  connected_at: string
  disconnected_at: string | null
}
