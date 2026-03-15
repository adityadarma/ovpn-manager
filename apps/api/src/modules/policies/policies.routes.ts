import type { FastifyPluginAsync } from 'fastify'
import crypto from 'node:crypto'
import { CreatePolicySchema } from '@ovpn/shared'

const policyRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/policies
  app.get(
    '/policies',
    { onRequest: [app.authenticate], schema: { tags: ['policies'], summary: 'List all network policies', security: [{ bearerAuth: [] }] } },
    async () => {
      const policies = await app.db('vpn_policies as p')
        .leftJoin('users as u', 'p.user_id', 'u.id')
        .leftJoin('groups as g', 'p.group_id', 'g.id')
        .select(
          'p.id',
          'p.user_id',
          'p.group_id',
          'p.allowed_network',
          'p.action',
          'p.priority',
          'p.description',
          'p.created_at',
          'u.username',
          'g.name as group_name'
        )
        .orderBy('p.priority', 'asc')
      
      return policies
    },
  )

  // POST /api/v1/policies
  app.post(
    '/policies',
    { onRequest: [app.authenticateAdmin], schema: { tags: ['policies'], summary: 'Create a network policy', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const input = CreatePolicySchema.parse(request.body)
      
      // Validate: either userId or groupId must be provided, but not both
      if (input.userId && input.groupId) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Cannot specify both userId and groupId' })
      }
      if (!input.userId && !input.groupId) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Must specify either userId or groupId' })
      }
      
      const id = crypto.randomUUID()
      await app.db('vpn_policies').insert({
        id,
        user_id: input.userId ?? null,
        group_id: input.groupId ?? null,
        allowed_network: input.allowedNetwork,
        action: input.action ?? 'allow',
        priority: input.priority ?? 100,
        description: input.description ?? null,
      })

      return reply.status(201).send(await app.db('vpn_policies').where({ id }).first())
    },
  )

  // DELETE /api/v1/policies/:id
  app.delete<{ Params: { id: string } }>(
    '/policies/:id',
    { onRequest: [app.authenticateAdmin], schema: { tags: ['policies'], summary: 'Delete a network policy', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const deleted = await app.db('vpn_policies').where({ id: request.params.id }).delete()
      if (!deleted) return reply.status(404).send({ error: 'Not Found', message: 'Policy not found' })
      return reply.status(204).send()
    },
  )
}

export default policyRoutes
