import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.string('username', 100).notNullable() // Store username in case user is deleted
    table.string('action', 100).notNullable() // e.g., 'user.create', 'policy.delete'
    table.string('resource_type', 50).notNullable() // e.g., 'user', 'policy', 'node'
    table.uuid('resource_id').nullable() // ID of the affected resource
    table.text('details').nullable() // JSON string with additional details
    table.string('ip_address', 45).nullable() // IPv4 or IPv6
    table.string('user_agent', 500).nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    
    table.index(['user_id'])
    table.index(['action'])
    table.index(['resource_type'])
    table.index(['created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs')
}
