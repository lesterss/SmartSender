export type WebhookListLocationState = {
  listSearch?: string
}

export function webhookListPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('listSearch' in state)) {
    return '/webhooks'
  }

  const listSearch = (state as WebhookListLocationState).listSearch
  if (typeof listSearch !== 'string' || listSearch === '') return '/webhooks'
  return `/webhooks?${listSearch}`
}

export function webhookListLinkState(listSearch: string): WebhookListLocationState {
  return { listSearch }
}
