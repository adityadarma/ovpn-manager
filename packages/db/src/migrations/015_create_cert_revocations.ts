import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cert_revocations', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('node_id').notNullable().references('id').inTable('vpn_nodes').onDelete('CASCADE')
    table.text('revoked_cert').notNullable().comment('Revoked certificate (PEM format)')
    table.string('serial_number', 100).nullable().comment('Certificate serial number')
    table.string('reason', 100).nullable().comment('Revocation reason')
    table.uuid('revoked_by').nullable().references('id').inTable('users').comment('Admin who revoked')
    table.timestamp('revoked_at').notNullable().defaultTo(knex.fn.now())
    
    table.index(['user_id', 'revoked_at'])
    table.index(['node_id', 'revoked_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cert_revocations')
}
