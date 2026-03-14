import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Auth API', () => {
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
  })

  afterAll(async () => {
    await app.close()
  })

  it('should allow admin login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'Admin@1234!' }
    })
    
    expect(res.statusCode).toBe(200)
    const json = res.json()
    expect(json.token).toBeDefined()
    expect(json.user.username).toBe('admin')
    expect(json.user.role).toBe('admin')

    adminToken = json.token
  })

  it('should reject invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin', password: 'wrongpassword' }
    })
    
    expect(res.statusCode).toBe(401)
  })

  it('should get current user info with /auth/me', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    
    expect(res.statusCode).toBe(200)
    expect(res.json().username).toBe('admin')
  })
})
