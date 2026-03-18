import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('session_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('session_id').notNullable().references('id').inTable('vpn_sessions').onDelete('CASCADE')
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now())
    table.bigInteger('bytes_sent_delta').notNullable().defaultTo(0) // bytes since last record
    table.bigInteger('bytes_received_delta').notNullable().defaultTo(0)
    table.bigInteger('bytes_sent_total').notNullable().defaultTo(0) // cumulative
    table.bigInteger('bytes_received_total').notNullable().defaultTo(0)
    table.integer('latency_ms').nullable() // ping latency
    table.decimal('packet_loss_percent', 5, 2).nullable()
    
    table.index(['session_id', 'recorded_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('session_activities')
}
