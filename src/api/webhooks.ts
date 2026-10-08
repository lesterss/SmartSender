import type { User, Webhook, WebhookInput, WebhookList } from './types'
import { api } from './client'

export const meQueryKey = ['me'] as const

export function webhooksQueryKey(page: number, search: string) {
  return ['webhooks', page, search] as const
}

export function webhookQueryKey(id: string) {
  return ['webhook', id] as const
}

export function fetchMe() {
  return api.get<User>('/v1/me')
}

export function fetchWebhooks(page: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: '10',
  })
  if (search) params.set('search', search)
  return api.get<WebhookList>(`/v1/webhooks?${params.toString()}`)
}

export function fetchWebhook(id: string) {
  return api.get<Webhook>(`/v1/webhooks/${id}`)
}

export function updateWebhook(id: string, input: WebhookInput) {
  return api.put<Webhook>(`/v1/webhooks/${id}`, input)
}
