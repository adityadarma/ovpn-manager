import { readFileSync, existsSync } from 'node:fs'

export async function handleSyncCertificates(): Promise<Record<string, unknown>> {
  const CA_CERT_PATH = '/etc/openvpn/server/ca.crt'
  const TLS_CRYPT_PATH = '/etc/openvpn/server/tls-crypt.key'
  const TLS_AUTH_PATH = '/etc/openvpn/server/ta.key'

  // Check if CA cert exists
  if (!existsSync(CA_CERT_PATH)) {
    throw new Error(`CA certificate not found at ${CA_CERT_PATH}`)
  }

  // Check for TLS key (prefer tls-crypt over tls-auth)
  let tlsKeyPath = TLS_CRYPT_PATH
  if (!existsSync(TLS_CRYPT_PATH)) {
    if (existsSync(TLS_AUTH_PATH)) {
      console.log('[sync-certs] Using tls-auth key (consider upgrading to tls-crypt)')
      tlsKeyPath = TLS_AUTH_PATH
    } else {
      throw new Error('No TLS key found. Please generate tls-crypt.key or ta.key')
    }
  }

  try {
    // Read certificates
    const caCert = readFileSync(CA_CERT_PATH, 'utf-8')
    const tlsKey = readFileSync(tlsKeyPath, 'utf-8')

    if (!caCert || !tlsKey) {
      throw new Error('Failed to read certificate files')
    }

    console.log('[sync-certs] Certificates read successfully')
    console.log(`[sync-certs] CA Cert: ${caCert.length} bytes`)
    console.log(`[sync-certs] TLS Key: ${tlsKey.length} bytes (${tlsKeyPath.includes('tls-crypt') ? 'tls-crypt' : 'tls-auth'})`)

    return {
      ca_cert: caCert.trim(),
      ta_key: tlsKey.trim(),
      tls_method: tlsKeyPath.includes('tls-crypt') ? 'tls-crypt' : 'tls-auth'
    }
  } catch (error: any) {
    console.error('[sync-certs] Failed to read certificates:', error.message)
    throw new Error(`Failed to sync certificates: ${error.message}`)
  }
}
