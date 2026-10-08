import { http, HttpResponse } from 'msw'
import type { ApiErrorType } from '../api/types'
import {
  CSRF_TOKEN,
  getUser,
  getWebhook,
  issueSession,
  isSessionAlive,
  listWebhooks,
  loginUser,
  revokeSession,
  rotateSession,
  updateWebhook,
} from './db'

type RouteArgs = {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}

function matchPath(pathname: string, pattern: string) {
  const expected = pattern.split('/').filter(Boolean)
  const actual = pathname.split('/').filter(Boolean)
  if (expected.length !== actual.length) return null

  const params: Record<string, string> = {}
  for (let index = 0; index < expected.length; index += 1) {
    const token = expected[index]
    const value = actual[index]
    if (!token || value === undefined) return null
    if (token.startsWith(':')) params[token.slice(1)] = decodeURIComponent(value)
    else if (token !== value) return null
  }
  return params
}

function route(
  method: 'get' | 'post' | 'put',
  pattern: string,
  resolver: (args: RouteArgs) => Promise<Response> | Response,
) {
  return http[method](({ request }) => {
    const params = matchPath(new URL(request.url).pathname, pattern)
    if (!params) return false
    return { matches: true, params }
  }, ({ request, params }) => resolver({ request, params }))
}

type LoginBody = {
  email?: string
  password?: string
  fingerprint?: string
}

type IssueBody = {
  device_session_token?: string
  fingerprint?: string
}

type RotateBody = {
  fingerprint?: string
}

type WebhookBody = {
  name?: string
  url?: string
}

function errorResponse(
  status: number,
  type: ApiErrorType,
  message: string,
  payload?: Record<string, string[]>,
) {
  return HttpResponse.json(
    { error: { type, message, ...(payload ? { payload } : {}) } },
    { status },
  )
}

function validationError(payload: Record<string, string[]>) {
  return errorResponse(422, 'ValidationException', 'The given data was invalid.', payload)
}

function requireCsrf(request: Request) {
  if (request.headers.get('X-CSRF-TOKEN') !== CSRF_TOKEN) {
    return errorResponse(419, 'TokenMismatchException', 'CSRF token mismatch.')
  }
  return null
}

function requireSession() {
  if (!isSessionAlive()) {
    return errorResponse(401, 'AuthenticationException', 'Unauthenticated.')
  }
  return null
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateWebhook(body: WebhookBody) {
  const payload: Record<string, string[]> = {}
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    payload.name = ['The name field is required.']
  }
  if (typeof body.url !== 'string' || !isHttpUrl(body.url)) {
    payload.url = ['The url must be a valid URL.']
  }
  return payload
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

function readPage(request: Request) {
  const page = Number(new URL(request.url).searchParams.get('page') ?? '1')
  return Number.isInteger(page) && page > 0 ? page : 1
}

function readSearch(request: Request) {
  return new URL(request.url).searchParams.get('search') ?? ''
}

function routeId(id: string | readonly string[] | undefined) {
  if (Array.isArray(id)) return id[0] ?? ''
  return id ?? ''
}

export const handlers = [
  route('get', '/csrf', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: { 'X-CSRF-TOKEN': CSRF_TOKEN },
    })
  }),

  route('post', '/auth/login', async ({ request }) => {
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const captcha = request.headers.get('X-Captcha-Token')
    if (!captcha || captcha.trim() === '') {
      return errorResponse(400, 'BadRequestException', 'Captcha token is required.')
    }

    const body = await readJson<LoginBody>(request)
    if (!body?.email || !body.password || !body.fingerprint) {
      const payload: Record<string, string[]> = {}
      if (!body?.email) payload.email = ['The email field is required.']
      if (!body?.password) payload.password = ['The password field is required.']
      if (!body?.fingerprint) payload.fingerprint = ['The fingerprint field is required.']
      return validationError(payload)
    }

    const token = loginUser(body.email, body.password, body.fingerprint)
    if (!token) {
      return validationError({
        password: ['These credentials do not match our records.'],
      })
    }

    return HttpResponse.json({ device_session_token: token })
  }),

  route('post', '/auth/token/issue', async ({ request }) => {
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await readJson<IssueBody>(request)
    if (!body?.device_session_token || !body.fingerprint) {
      return validationError({
        device_session_token: ['The device session token is invalid.'],
      })
    }

    if (!issueSession(body.device_session_token, body.fingerprint)) {
      return validationError({
        device_session_token: ['The device session token is invalid.'],
      })
    }

    return HttpResponse.json({})
  }),

  route('post', '/auth/token/rotate', async ({ request }) => {
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await readJson<RotateBody>(request)
    if (!body?.fingerprint || !rotateSession(body.fingerprint)) {
      return errorResponse(400, 'BadRequestException', 'Unable to rotate the session.')
    }

    return HttpResponse.json({})
  }),

  route('post', '/auth/token/revoke', async ({ request }) => {
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await readJson<RotateBody>(request)
    if (!body?.fingerprint) {
      return errorResponse(400, 'BadRequestException', 'Fingerprint is required.')
    }

    revokeSession()
    return new HttpResponse(null, { status: 204 })
  }),

  route('get', '/v1/me', () => {
    const authError = requireSession()
    if (authError) return authError
    return HttpResponse.json(getUser())
  }),

  route('get', '/v1/webhooks', ({ request }) => {
    const authError = requireSession()
    if (authError) return authError
    return HttpResponse.json(listWebhooks(readPage(request), readSearch(request)))
  }),

  route('get', '/v1/webhooks/:id', ({ params }) => {
    const authError = requireSession()
    if (authError) return authError

    const webhook = getWebhook(routeId(params.id))
    if (!webhook) {
      return errorResponse(404, 'NotFoundException', 'Webhook not found.')
    }
    return HttpResponse.json(webhook)
  }),

  route('put', '/v1/webhooks/:id', async ({ request, params }) => {
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const authError = requireSession()
    if (authError) return authError

    const current = getWebhook(routeId(params.id))
    if (!current) {
      return errorResponse(404, 'NotFoundException', 'Webhook not found.')
    }

    const body = (await readJson<WebhookBody>(request)) ?? {}
    const payload = validateWebhook(body)
    if (Object.keys(payload).length > 0) return validationError(payload)

    const updated = updateWebhook(current.id, {
      name: body.name ?? '',
      url: body.url ?? '',
    })
    return HttpResponse.json(updated)
  }),
]
