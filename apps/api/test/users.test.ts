import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Users API', () => {
  let app: FastifyInstance
  let adminToken: string

  beforeAll(async () => {
    app = await buildApp({
      DATABASE_TYPE: 'sqlite',
      DATABASE_SQLITE_PATH: ':memory:', // Use in-memory DB for tests
      JWT_SECRET: 'test-secret-test-secret-test-secret',
      JWT_EXPIRES_IN: '1h',
      NODE_ENV: 'test',
    } as any)

    // Run migrations & seeds required
    await app.db.migrate.latest()
    await app.db.seed.run()

    // Get admin token
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'Admin@1234!' }
    })
    
    expect(res.statusCode).toBe(200)
    adminToken = res.json().token
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
  })

  it('should create a user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
        role: 'user'
      }
    })
    
    expect(res.statusCode).toBe(201)
    const json = res.json()
    expect(json.username).toBe('testuser')
    expect(json.id).toBeDefined()
  })
})
