import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { fetchWebhooks, webhooksQueryKey } from '../../api/webhooks'
import type { WebhookList } from '../../api/types'

function readPage(value: string | null): number {
  if (!value) return 1
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

export type WebhookListQuery = {
  page: number
  search: string
  searchDraft: string
  setSearchDraft: (value: string) => void
  setPage: (page: number) => void
  listSearch: string
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => Promise<unknown>
  list: WebhookList | undefined
}

export function useWebhookList(): WebhookListQuery {
  const [params, setParams] = useSearchParams()
  const page = readPage(params.get('page'))
  const search = params.get('search') ?? ''
  const [draft, setDraft] = useState(search)
  const [seenSearch, setSeenSearch] = useState(search)

  if (search !== seenSearch) {
    setSeenSearch(search)
    setDraft(search)
  }

  useEffect(() => {
    if (draft === search) return
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const next = new URLSearchParams(current)
        if (draft) next.set('search', draft)
        else next.delete('search')
        next.delete('page')
        return next
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draft, search, setParams])

  const query = useQuery({
    queryKey: webhooksQueryKey(page, search),
    queryFn: () => fetchWebhooks(page, search),
  })

  function setPage(nextPage: number) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage <= 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }

  return {
    page,
    search,
    searchDraft: draft,
    setSearchDraft: setDraft,
    setPage,
    listSearch: params.toString(),
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    list: query.data,
  }
}
