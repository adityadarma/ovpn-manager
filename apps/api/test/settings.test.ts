import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

describe('Settings API', () => {
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

  it('should bulk update settings', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/settings',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: { 'vpn_name': 'My Super VPN', 'vpn_domain': 'vpn.example.com' }
    })
    
    expect(res.statusCode).toBe(200)
    expect(res.json().ok).toBe(true)
  })

  it('should list settings', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/settings',
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    
    expect(res.statusCode).toBe(200)
    const settings = res.json()
    expect(Array.isArray(settings)).toBe(true)
  })
})
