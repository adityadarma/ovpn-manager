import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cert_download_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('node_id').notNullable().references('id').inTable('vpn_nodes').onDelete('CASCADE')
    table.string('ip_address', 45).nullable().comment('IP address of downloader')
    table.string('user_agent', 500).nullable().comment('Browser user agent')
    table.timestamp('downloaded_at').notNullable().defaultTo(knex.fn.now())
    
    table.index(['user_id', 'downloaded_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cert_download_history')
}
