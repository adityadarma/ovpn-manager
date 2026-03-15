import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('vpn_policies', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('group_id').nullable().references('id').inTable('groups').onDelete('CASCADE')
    table.string('allowed_network', 50).notNullable()
    table.enu('action', ['allow', 'deny']).notNullable().defaultTo('allow')
    table.integer('priority').notNullable().defaultTo(100)
    table.text('description').nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    
    // Check constraint: either user_id or group_id must be set, but not both
    table.check('(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)', [], 'chk_policy_target')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vpn_policies')
}
