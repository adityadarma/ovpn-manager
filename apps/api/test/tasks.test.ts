import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Tasks API', () => {
  let app: FastifyInstance
  let adminToken: string

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

  it('should list tasks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
  })
})
