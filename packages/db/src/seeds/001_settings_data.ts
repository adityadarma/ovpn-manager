import type { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Default settings - insert only if not exists
  const defaultSettings = [
    { key: 'platform_name', value: 'OVPN VPN Manager', description: 'Platform display name' },
    { key: 'vpn_network', value: '10.8.0.0/24', description: 'Default VPN network CIDR' },
    { key: 'vpn_dns', value: '1.1.1.1,8.8.8.8', description: 'VPN DNS servers' },
    { key: 'max_sessions_per_user', value: '3', description: 'Max concurrent sessions per user' },
  ]

  for (const setting of defaultSettings) {
    const exists = await knex('settings')
      .where({ key: setting.key })
      .first()

    if (!exists) {
      await knex('settings').insert(setting)
    }
  }
}
