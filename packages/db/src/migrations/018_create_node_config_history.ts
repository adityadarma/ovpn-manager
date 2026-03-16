import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('node_config_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('node_id').notNullable().references('id').inTable('vpn_nodes').onDelete('CASCADE')
    table.uuid('changed_by').nullable().references('id').inTable('users')
    table.text('old_config').nullable().comment('Old configuration (JSON)')
    table.text('new_config').notNullable().comment('New configuration (JSON)')
    table.text('change_summary').nullable().comment('Summary of changes')
    table.timestamp('changed_at').notNullable().defaultTo(knex.fn.now())
    
    table.index(['node_id', 'changed_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('node_config_history')
}
