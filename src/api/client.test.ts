import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { setupServer } from 'msw/node'
import { clearSession } from '../auth/session'
import { getRotateCount, resetDb, seedExpiredSession } from '../mocks/db'
import { handlers } from '../mocks/handlers'
import { api, resetApiClient } from './client'
import type { User, WebhookList } from './types'

const server = setupServer(...handlers)

function installMemoryStorage() {
  const memory = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return memory.size
    },
    clear() {
      memory.clear()
    },
    getItem(key) {
      return memory.get(key) ?? null
    },
    key(index) {
      return [...memory.keys()][index] ?? null
    },
    removeItem(key) {
      memory.delete(key)
    },
    setItem(key, value) {
      memory.set(key, value)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
}

beforeAll(() => {
  installMemoryStorage()
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  resetDb()
  resetApiClient()
  clearSession()
  localStorage.clear()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

test('two parallel 401 responses share a single rotate and then succeed', async () => {
  seedExpiredSession()

  const [me, list] = await Promise.all([
    api.get<User>('/v1/me'),
    api.get<WebhookList>('/v1/webhooks?page=1&limit=10'),
  ])

  expect(getRotateCount()).toBe(1)
  expect(me.email).toBe('demo@smartsender.test')
  expect(list.data.length).toBeGreaterThan(0)
  expect(list.paging.results.limitation).toBe(10)
})
