import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Groups & Networks API', () => {
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

  it('creates a new group', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/groups',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: { name: 'IT Staff', description: 'Tech team' }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('IT Staff')
  })

  it('creates a new network', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/networks',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: { name: 'DB Servers', cidr: '10.0.1.0/24' }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().cidr).toBe('10.0.1.0/24')
  })
})
