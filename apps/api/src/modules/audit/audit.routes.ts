import type { FastifyPluginAsync } from 'fastify'

interface AuditLog {
  id: string
  user_id: string | null
  username: string
  action: string
  resource_type: string
  resource_id: string | null
  details: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const auditRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/audit — list audit logs
  app.get(
    '/audit',
    { 
      onRequest: [app.authenticateAdmin], 
      schema: { 
        tags: ['audit'], 
        summary: 'List audit logs (admin only)', 
        security: [{ bearerAuth: [] }] 
      } 
    },
    async (request) => {
      const query = request.query as { 
        page?: string
        limit?: string
        action?: string
        resourceType?: string
        userId?: string
      }
      
      const page = parseInt(query.page ?? '1')
      const limit = Math.min(parseInt(query.limit ?? '50'), 100)
      const offset = (page - 1) * limit

      const builder = app.db('audit_logs')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)

      if (query.action) builder.where('action', query.action)
      if (query.resourceType) builder.where('resource_type', query.resourceType)
      if (query.userId) builder.where('user_id', query.userId)

      return builder
    },
  )

  // Helper function to create audit log
  app.decorate('createAuditLog', async (data: {
    userId: string | null
    username: string
    action: string
    resourceType: string
    resourceId?: string | null
    details?: Record<string, unknown>
    ipAddress?: string | null
    userAgent?: string | null
  }) => {
    await app.db('audit_logs').insert({
      id: crypto.randomUUID(),
      user_id: data.userId,
      username: data.username,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId ?? null,
      details: data.details ? JSON.stringify(data.details) : null,
      ip_address: data.ipAddress ?? null,
      user_agent: data.userAgent ?? null,
    })
  })
}

export default auditRoutes

declare module 'fastify' {
  interface FastifyInstance {
    createAuditLog: (data: {
      userId: string | null
      username: string
      action: string
      resourceType: string
      resourceId?: string | null
      details?: Record<string, unknown>
      ipAddress?: string | null
      userAgent?: string | null
    }) => Promise<void>
  }
}
