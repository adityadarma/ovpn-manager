import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Update existing 'unknown' nodes to 'offline'
  await knex('vpn_nodes').where('status', 'unknown').update({ status: 'offline' })
  
  // Change status enum to only 'online' and 'offline', default to 'offline'
  await knex.schema.alterTable('vpn_nodes', (table) => {
    table.enu('status', ['online', 'offline']).notNullable().defaultTo('offline').alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vpn_nodes', (table) => {
    table.enu('status', ['online', 'offline', 'unknown']).notNullable().defaultTo('unknown').alter()
  })
}
