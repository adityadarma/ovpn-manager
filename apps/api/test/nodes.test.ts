import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Nodes API', () => {
  let app: FastifyInstance
  let adminToken: string
  let nodeId: string
  let nodeToken: string

  beforeAll(async () => {
    app = await buildApp({
      DATABASE_TYPE: 'sqlite',
      DATABASE_SQLITE_PATH: ':memory:',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      NODE_ENV: 'test',
    } as any)

    await app.db.migrate.latest()
    await app.db.seed.run()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'Admin@1234!' }
    })
    adminToken = res.json().token
  })

  afterAll(async () => {
    await app.close()
  })

  it('should register a new node', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/nodes/register',
      payload: { hostname: 'Test Node', ip: '10.0.0.1', port: 1194, region: 'us-east', version: '1.0.0' }
    })
    
    expect(res.statusCode).toBe(201)
    const json = res.json()
    expect(json.id).toBeDefined()
    expect(json.token).toBeDefined()
    
    nodeId = json.id
    nodeToken = json.token
  })

  it('should list nodes for admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/nodes',
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    
    expect(res.statusCode).toBe(200)
    const json = res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.some((n: any) => n.id === nodeId)).toBe(true)
  })

  it('should handle node heartbeat', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/nodes/heartbeat',
      payload: { nodeId }
    })
    
    expect(res.statusCode).toBe(200)
  })
})
