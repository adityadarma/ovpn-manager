import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vpn_sessions', (table) => {
    table.timestamp('last_activity_at').nullable()
    table.string('disconnect_reason', 50).nullable() // normal, timeout, error, admin_kick, cert_revoked, reconnect
    table.string('client_version', 100).nullable()
    table.string('device_name', 255).nullable()
    table.string('geo_country', 2).nullable() // ISO country code
    table.string('geo_city', 100).nullable()
    table.integer('connection_duration_seconds').nullable() // calculated on disconnect
    
    // Indexes for performance
    table.index(['user_id', 'connected_at'])
    table.index(['node_id', 'connected_at'])
    table.index(['disconnected_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vpn_sessions', (table) => {
    table.dropIndex(['user_id', 'connected_at'])
    table.dropIndex(['node_id', 'connected_at'])
    table.dropIndex(['disconnected_at'])
    
    table.dropColumn('last_activity_at')
    table.dropColumn('disconnect_reason')
    table.dropColumn('client_version')
    table.dropColumn('device_name')
    table.dropColumn('geo_country')
    table.dropColumn('geo_city')
    table.dropColumn('connection_duration_seconds')
  })
}
