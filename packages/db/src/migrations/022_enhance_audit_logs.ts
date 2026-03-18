import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.uuid('session_id').nullable().references('id').inTable('vpn_sessions').onDelete('SET NULL')
    table.text('metadata').nullable() // JSON field for additional context
    
    table.index(['session_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.dropIndex(['session_id'])
    table.dropColumn('session_id')
    table.dropColumn('metadata')
  })
}
