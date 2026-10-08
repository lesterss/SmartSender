import { isApiError } from '../../api/errors'

type QueryStatusProps = {
  isPending: boolean
  isError: boolean
  error: unknown
  pendingLabel?: string
  fallbackMessage: string
  onRetry: () => void
}

export function QueryStatus({
  isPending,
  isError,
  error,
  pendingLabel = 'Завантаження…',
  fallbackMessage,
  onRetry,
}: QueryStatusProps) {
  if (isPending) return <p className="status">{pendingLabel}</p>

  if (!isError) return null

  return (
    <div className="status error" role="alert">
      <p>{isApiError(error) ? error.message : fallbackMessage}</p>
      <button type="button" onClick={onRetry}>
        Спробувати знову
      </button>
    </div>
  )
}
