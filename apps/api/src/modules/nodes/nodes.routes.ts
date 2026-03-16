import type { FastifyPluginAsync } from 'fastify'
import crypto from 'node:crypto'
import { RegisterNodeSchema, HeartbeatSchema } from '@ovpn/shared'

interface NodeConfig {
  port: number
  protocol: string
  tunnel_mode: string
  vpn_network: string
  vpn_netmask: string
  dns_servers: string
  push_routes: string
  cipher: string
  auth_digest: string
  compression: string
  keepalive_ping: number
  keepalive_timeout: number
  max_clients: number
}

const nodeRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/nodes
  app.get(
    '/nodes',
    { onRequest: [app.authenticate], schema: { tags: ['nodes'], summary: 'List all VPN nodes', security: [{ bearerAuth: [] }] } },
    async () => app.db('vpn_nodes').select('id', 'hostname', 'ip_address', 'port', 'region', 'status', 'version', 'last_seen', 'created_at'),
  )

  // GET /api/v1/nodes/:id
  app.get<{ Params: { id: string } }>(
    '/nodes/:id',
    { onRequest: [app.authenticate], schema: { tags: ['nodes'], summary: 'Get node by ID', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const node = await app.db('vpn_nodes').where({ id: request.params.id }).first()
      if (!node) return reply.status(404).send({ error: 'Not Found', message: 'Node not found' })
      const { token: _token, ...safeNode } = node
      return safeNode
    },
  )

  // GET /api/v1/nodes/:id/config
  app.get<{ Params: { id: string } }>(
    '/nodes/:id/config',
    { onRequest: [app.authenticate], schema: { tags: ['nodes'], summary: 'Get node configuration', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const config = await app.db('vpn_nodes').where({ id: request.params.id }).first()
      if (!config) return reply.status(404).send({ error: 'Not Found', message: 'Node not found' })
      
      return {
        port: config.port,
        protocol: config.protocol,
        tunnel_mode: config.tunnel_mode,
        vpn_network: config.vpn_network,
        vpn_netmask: config.vpn_netmask,
        dns_servers: config.dns_servers,
        push_routes: config.push_routes,
        cipher: config.cipher,
        auth_digest: config.auth_digest,
        compression: config.compression,
        keepalive_ping: config.keepalive_ping,
        keepalive_timeout: config.keepalive_timeout,
        max_clients: config.max_clients,
      }
    },
  )

  // PUT /api/v1/nodes/:id/config
  app.put<{ Params: { id: string }; Body: NodeConfig }>(
    '/nodes/:id/config',
    { onRequest: [app.authenticateAdmin], schema: { tags: ['nodes'], summary: 'Update node configuration', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const node = await app.db('vpn_nodes').where({ id: request.params.id }).first()
      if (!node) return reply.status(404).send({ error: 'Not Found', message: 'Node not found' })

      const config = request.body as NodeConfig
      
      // Update database
      await app.db('vpn_nodes').where({ id: request.params.id }).update({
        port: config.port,
        protocol: config.protocol,
        tunnel_mode: config.tunnel_mode,
        vpn_network: config.vpn_network,
        vpn_netmask: config.vpn_netmask,
        dns_servers: config.dns_servers,
        push_routes: config.push_routes,
        cipher: config.cipher,
        auth_digest: config.auth_digest,
        compression: config.compression,
        keepalive_ping: config.keepalive_ping,
        keepalive_timeout: config.keepalive_timeout,
        max_clients: config.max_clients,
      })

      // Create task to update server config
      const taskId = crypto.randomUUID()
      await app.db('tasks').insert({
        id: taskId,
        node_id: request.params.id,
        action: 'update_server_config',
        payload: JSON.stringify(config),
        status: 'pending',
        created_at: new Date(),
      })

      return { message: 'Configuration update scheduled', taskId }
    },
  )

  // POST /api/v1/nodes/register  (called by agent)
  app.post(
    '/nodes/register',
    { schema: { tags: ['nodes'], summary: 'Register a new VPN node (agent)' } },
    async (request, reply) => {
      const input = RegisterNodeSchema.parse(request.body)
      const token = crypto.randomBytes(32).toString('hex')
      const id = crypto.randomUUID()

      await app.db('vpn_nodes').insert({
        id,
        hostname: input.hostname,
        ip_address: input.ip,
        port: input.port ?? 1194,
        region: input.region ?? null,
        token,
        version: input.version,
        status: 'offline',
        last_seen: new Date(),
      })

      return reply.status(201).send({
        id,
        token, // Returned ONCE — agent must store it securely
        message: 'Node registered successfully',
      })
    },
  )

  // POST /api/v1/nodes/heartbeat  (called by agent)
  app.post(
    '/nodes/heartbeat',
    { schema: { tags: ['nodes'], summary: 'Agent heartbeat' } },
    async (request) => {
      const { nodeId, caCert, taKey } = HeartbeatSchema.parse(request.body)
      const updates: any = { status: 'online', last_seen: new Date() }
      if (caCert) updates.ca_cert = caCert
      if (taKey) updates.ta_key = taKey
      await app.db('vpn_nodes').where({ id: nodeId }).update(updates)
      return { ok: true }
    },
  )

  // GET /api/v1/nodes/:id/tasks  (polled by agent)
  app.get<{ Params: { id: string } }>(
    '/nodes/:id/tasks',
    { schema: { tags: ['nodes'], summary: 'Poll pending tasks for a node (agent)' } },
    async (request) => {
      const tasks = await app.db('tasks')
        .where({ node_id: request.params.id, status: 'pending' })
        .orderBy('created_at', 'asc')
        .select('id', 'action', 'payload', 'created_at')

      // Mark as running
      const ids = tasks.map((t: { id: string }) => t.id)
      if (ids.length > 0) {
        await app.db('tasks').whereIn('id', ids).update({ status: 'running' })
      }

      // Parse payload JSON strings
      const parsedTasks = tasks.map((task: any) => ({
        ...task,
        payload: typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload
      }))

      return { tasks: parsedTasks }
    },
  )

  // DELETE /api/v1/nodes/:id
  app.delete<{ Params: { id: string } }>(
    '/nodes/:id',
    { onRequest: [app.authenticateAdmin], schema: { tags: ['nodes'], summary: 'Remove a VPN node', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const deleted = await app.db('vpn_nodes').where({ id: request.params.id }).delete()
      if (!deleted) return reply.status(404).send({ error: 'Not Found', message: 'Node not found' })
      return reply.status(204).send()
    },
  )
}

export default nodeRoutes
