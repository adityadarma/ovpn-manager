export interface Certificate {
  id: string
  user_id: string
  cert_path: string
  serial_number: string | null
  revoked: boolean
  expires_at: string | null
  created_at: string
}
