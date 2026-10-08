import type { User, Webhook, WebhookInput, WebhookList } from '../api/types'

export const CSRF_TOKEN = 'smartsender-csrf-token'
export const PAGE_SIZE = 10
export const SESSION_TTL_MS = 30_000

export const TEST_CREDENTIALS = {
  email: 'demo@smartsender.test',
  password: 'password',
}

type SessionState = {
  issued: boolean
  revoked: boolean
  expiresAt: number
}

let deviceSessionToken: string | null = null
let loginFingerprint: string | null = null
let session: SessionState = { issued: false, revoked: false, expiresAt: 0 }
let rotateCount = 0
let webhooks = createWebhooks()

export function resetDb() {
  deviceSessionToken = null
  loginFingerprint = null
  session = { issued: false, revoked: false, expiresAt: 0 }
  rotateCount = 0
  webhooks = createWebhooks()
}

export function getRotateCount() {
  return rotateCount
}

export function seedExpiredSession() {
  deviceSessionToken = 'expired-device-token'
  loginFingerprint = 'a'.repeat(32)
  session = {
    issued: true,
    revoked: false,
    expiresAt: Date.now() - 1_000,
  }
}

export function isSessionAlive() {
  return session.issued && !session.revoked && Date.now() < session.expiresAt
}

export function canRotate() {
  return session.issued && !session.revoked
}

export function loginUser(email: string, password: string, fingerprint: string) {
  if (email !== TEST_CREDENTIALS.email || password !== TEST_CREDENTIALS.password) return null
  deviceSessionToken = randomHex(16)
  loginFingerprint = fingerprint
  return deviceSessionToken
}

export function issueSession(token: string, fingerprint: string) {
  if (!deviceSessionToken || token !== deviceSessionToken || fingerprint !== loginFingerprint) {
    return false
  }
  session = {
    issued: true,
    revoked: false,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  return true
}

export function rotateSession(fingerprint: string) {
  if (!canRotate() || fingerprint.trim() === '') return false
  rotateCount += 1
  session = {
    issued: true,
    revoked: false,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  return true
}

export function revokeSession() {
  session = { issued: session.issued, revoked: true, expiresAt: 0 }
  deviceSessionToken = null
  loginFingerprint = null
}

export function getUser(): User {
  return {
    id: 'user-1',
    email: TEST_CREDENTIALS.email,
    first_name: 'Demo',
    last_name: 'User',
    name: 'Demo User',
  }
}

export function listWebhooks(page: number, search: string): WebhookList {
  const query = search.trim().toLowerCase()
  const filtered = webhooks.filter((webhook) => webhook.name.toLowerCase().includes(query))
  const total = filtered.length
  const last = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Number.isInteger(page) && page > 0 ? page : 1
  const start = (current - 1) * PAGE_SIZE

  return {
    data: filtered.slice(start, start + PAGE_SIZE),
    paging: {
      pages: { current, last },
      results: { total, limitation: PAGE_SIZE },
    },
  }
}

export function getWebhook(id: string) {
  return webhooks.find((webhook) => webhook.id === id) ?? null
}

export function updateWebhook(id: string, input: WebhookInput) {
  const index = webhooks.findIndex((webhook) => webhook.id === id)
  if (index === -1) return null
  const next: Webhook = { ...webhooks[index], name: input.name, url: input.url }
  webhooks[index] = next
  return next
}

function createWebhooks(): Webhook[] {
  return Array.from({ length: 28 }, (_, index) => {
    const number = index + 1
    return {
      id: String(number),
      name: number % 7 === 0 ? `Billing hook ${number}` : `Webhook ${number}`,
      url: `https://example.com/hooks/${number}`,
      active: number % 3 !== 0,
      created_at: new Date(Date.UTC(2024, 0, number, 8, 0, 0)).toISOString(),
    }
  })
}

function randomHex(bytes: number) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (value) => value.toString(16).padStart(2, '0')).join('')
}
