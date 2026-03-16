import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('cert_auto_renew').defaultTo(false).comment('Enable auto-renewal before expiry')
    table.integer('cert_renew_days_before').defaultTo(30).comment('Renew certificate X days before expiry')
    table.timestamp('cert_last_renewed_at').nullable().comment('Last renewal timestamp')
    table.integer('cert_renewal_count').defaultTo(0).comment('Number of times certificate was renewed')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('cert_auto_renew')
    table.dropColumn('cert_renew_days_before')
    table.dropColumn('cert_last_renewed_at')
    table.dropColumn('cert_renewal_count')
  })
}
