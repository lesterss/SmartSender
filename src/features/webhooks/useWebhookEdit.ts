import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isApiError } from '../../api/errors'
import type { Webhook, WebhookInput } from '../../api/types'
import { fetchWebhook, updateWebhook, webhookQueryKey } from '../../api/webhooks'

export type WebhookEditFormState = {
  name: string
  url: string
  fieldErrors: Record<string, string[]> | undefined
  formError: string | undefined
  isSaving: boolean
  isSaved: boolean
  canSave: boolean
  setName: (value: string) => void
  setUrl: (value: string) => void
  submit: (input: WebhookInput) => void
}

export type WebhookEditQuery = {
  webhook: Webhook | undefined
  isLoading: boolean
  isNotFound: boolean
  isError: boolean
  error: unknown
  refetch: () => Promise<unknown>
  form: WebhookEditFormState
}

export function useWebhookEdit(id: string): WebhookEditQuery {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [sourceId, setSourceId] = useState('')

  const query = useQuery({
    queryKey: webhookQueryKey(id),
    queryFn: () => fetchWebhook(id),
    enabled: id !== '',
  })

  if (query.data && sourceId !== query.data.id) {
    setSourceId(query.data.id)
    setName(query.data.name)
    setUrl(query.data.url)
  }

  const mutation = useMutation({
    mutationFn: (input: WebhookInput) => updateWebhook(id, input),
    onSuccess: (webhook) => {
      queryClient.setQueryData(webhookQueryKey(id), webhook)
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const fieldErrors = isApiError(mutation.error) ? mutation.error.payload : undefined
  const formError =
    mutation.isError && !fieldErrors
      ? mutation.error instanceof Error
        ? mutation.error.message
        : 'Не вдалося зберегти.'
      : undefined

  function changeName(value: string) {
    setName(value)
    mutation.reset()
  }

  function changeUrl(value: string) {
    setUrl(value)
    mutation.reset()
  }

  const isNotFound = query.isError && isApiError(query.error) && query.error.status === 404
  const saved = query.data
  const canSave = saved !== undefined && (name !== saved.name || url !== saved.url)

  function submit(input: WebhookInput) {
    if (!saved || (input.name === saved.name && input.url === saved.url)) return
    mutation.mutate(input)
  }

  return {
    webhook: query.data,
    isLoading: query.isLoading,
    isNotFound,
    isError: query.isError && !isNotFound,
    error: query.error,
    refetch: query.refetch,
    form: {
      name,
      url,
      fieldErrors,
      formError,
      isSaving: mutation.isPending,
      isSaved: mutation.isSuccess,
      canSave,
      setName: changeName,
      setUrl: changeUrl,
      submit,
    },
  }
}
