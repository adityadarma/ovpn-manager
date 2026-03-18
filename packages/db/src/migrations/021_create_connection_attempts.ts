import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('connection_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.uuid('node_id').nullable().references('id').inTable('vpn_nodes').onDelete('SET NULL')
    table.string('username', 255).notNullable()
    table.string('real_ip', 45).notNullable()
    table.string('failure_reason', 255).notNullable() // invalid_credentials, account_disabled, cert_expired, etc.
    table.timestamp('attempted_at').notNullable().defaultTo(knex.fn.now())
    table.text('error_details').nullable()
    
    table.index(['user_id', 'attempted_at'])
    table.index(['real_ip', 'attempted_at'])
    table.index(['attempted_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('connection_attempts')
}
