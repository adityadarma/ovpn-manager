import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vpn_policies', (table) => {
    // Make user_id nullable so we can have group-based policies
    table.uuid('user_id').nullable().alter()
    
    // Add group_id column
    table.uuid('group_id').nullable().references('id').inTable('groups').onDelete('CASCADE')
    
    // Add check constraint: either user_id or group_id must be set, but not both
    table.check('(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)', [], 'chk_policy_target')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vpn_policies', (table) => {
    table.dropColumn('group_id')
    table.uuid('user_id').notNullable().alter()
  })
}
