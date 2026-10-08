import { Link, useLocation, useParams } from 'react-router'
import { AppShell } from '../layout/AppShell'
import { QueryStatus } from './QueryStatus'
import { useWebhookEdit } from './useWebhookEdit'
import { WebhookEditForm } from './WebhookEditForm'
import { webhookListPath } from './webhookNavigation'

export function WebhookEditPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const edit = useWebhookEdit(id)
  const backTo = webhookListPath(location.state)

  return (
    <AppShell>
      <p>
        <Link to={backTo}>Назад до списку</Link>
      </p>
      <h1>Редагування</h1>

      {edit.isLoading ? <p className="status">Завантаження…</p> : null}

      {edit.isNotFound ? (
        <p className="status error" role="alert">
          Вебхук не знайдено.
        </p>
      ) : null}

      <QueryStatus
        isPending={false}
        isError={edit.isError}
        error={edit.error}
        fallbackMessage="Не вдалося завантажити вебхук."
        onRetry={() => void edit.refetch()}
      />

      {edit.webhook ? <WebhookEditForm form={edit.form} /> : null}
    </AppShell>
  )
}
