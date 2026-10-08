import { getFingerprint } from '../auth/fingerprint'
import { clearSession } from '../auth/session'
import { ApiError, toApiError } from './errors'

type Method = 'GET' | 'POST' | 'PUT'

type RequestOptions = {
  method?: Method
  body?: unknown
  headers?: Record<string, string>
  authRetry?: boolean
  csrfRetry?: boolean
  skipAuthRefresh?: boolean
  unmockedRetry?: boolean
}

const REQUESTED_WITH = 'XMLHttpRequest'

let csrfToken: string | null = null
let csrfInflight: Promise<string> | null = null
let rotateInflight: Promise<void> | null = null
let sessionEnded = false
let onSessionEnd: () => void = () => {}
let onUnmocked: (giveUp: boolean) => Promise<void> | void = () => {}

export function setSessionEndHandler(handler: () => void) {
  onSessionEnd = handler
}

export function setUnmockedHandler(handler: (giveUp: boolean) => Promise<void> | void) {
  onUnmocked = handler
}

export function resetSessionGuard() {
  sessionEnded = false
}

export function resetApiClient() {
  csrfToken = null
  csrfInflight = null
  rotateInflight = null
  sessionEnded = false
  onSessionEnd = () => {}
  onUnmocked = () => {}
}

function endLocalSession() {
  clearSession()
  if (sessionEnded) return
  sessionEnded = true
  onSessionEnd()
}

function origin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost'
}

function toUrl(path: string) {
  return new URL(path, origin()).toString()
}

function isUnmockedResponse(response: Response) {
  if (response.status !== 404) return false
  const type = response.headers.get('content-type') ?? ''
  return !type.includes('application/json')
}

async function readCsrf(allowRetry = true): Promise<string> {
  const response = await fetch(toUrl('/csrf'), {
    method: 'GET',
    headers: {
      'X-Requested-With': REQUESTED_WITH,
      Accept: 'application/json',
    },
  })
  const token = response.headers.get('X-CSRF-TOKEN')
  if ((response.status !== 204 || !token) && allowRetry && isUnmockedResponse(response)) {
    await onUnmocked(false)
    return readCsrf(false)
  }
  if (response.status !== 204 || !token) {
    if (isUnmockedResponse(response)) await onUnmocked(true)
    throw new ApiError(response.status, 'BadRequestException', 'CSRF token is missing.')
  }
  csrfToken = token
  return token
}

function ensureCsrf() {
  if (csrfToken) return Promise.resolve(csrfToken)
  if (!csrfInflight) {
    csrfInflight = readCsrf().finally(() => {
      csrfInflight = null
    })
  }
  return csrfInflight
}

async function execute(path: string, options: RequestOptions) {
  const method = options.method ?? 'GET'
  await ensureCsrf()

  const headers = new Headers({
    'X-Requested-With': REQUESTED_WITH,
    Accept: 'application/json',
  })
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value)
    }
  }
  if (method === 'POST' || method === 'PUT') {
    if (!csrfToken) {
      throw new ApiError(419, 'TokenMismatchException', 'CSRF token is missing.')
    }
    headers.set('X-CSRF-TOKEN', csrfToken)
  }
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(toUrl(path), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

async function performRotate() {
  await request<unknown>('/auth/token/rotate', {
    method: 'POST',
    body: { fingerprint: getFingerprint() },
    skipAuthRefresh: true,
    authRetry: false,
  })
}

function rotateOnce() {
  if (!rotateInflight) {
    rotateInflight = performRotate()
      .catch((error: unknown) => {
        endLocalSession()
        throw error
      })
      .finally(() => {
        rotateInflight = null
      })
  }
  return rotateInflight
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await execute(path, options)

  // Порожній 404 без JSON — відповідь Vite: service worker не перехопив запит.
  if (isUnmockedResponse(response)) {
    if (options.unmockedRetry !== false) {
      await onUnmocked(false)
      return request<T>(path, { ...options, unmockedRetry: false })
    }
    await onUnmocked(true)
  }

  if (response.status === 419 && options.csrfRetry !== false) {
    csrfToken = null
    await ensureCsrf()
    return request<T>(path, { ...options, csrfRetry: false })
  }

  if (response.status === 401 && !options.skipAuthRefresh && options.authRetry !== false) {
    await rotateOnce()
    return request<T>(path, { ...options, authRetry: false })
  }

  if (response.status === 401) {
    if (!options.skipAuthRefresh) endLocalSession()
    throw await toApiError(response)
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },
  post<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>(path, { method: 'POST', body, headers })
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PUT', body })
  },
}
