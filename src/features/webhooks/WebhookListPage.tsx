import { AppShell } from '../layout/AppShell'
import { QueryStatus } from './QueryStatus'
import { useWebhookList } from './useWebhookList'
import { WebhookPager, WebhookTable } from './WebhookTable'

export function WebhookListPage() {
  const list = useWebhookList()
  const total = list.list?.paging.results.total
  const current = list.list?.paging.pages.current ?? list.page
  const last = list.list?.paging.pages.last ?? 1
  const rows = list.list?.data ?? []

  return (
    <AppShell>
      <div className="page-heading">
        <h1>Вебхуки</h1>
        <label className="search">
          <span>Пошук за назвою</span>
          <input
            value={list.searchDraft}
            onChange={(event) => list.setSearchDraft(event.target.value)}
            placeholder="Назва"
          />
        </label>
      </div>

      <QueryStatus
        isPending={list.isPending}
        isError={list.isError}
        error={list.error}
        fallbackMessage="Не вдалося завантажити список."
        onRetry={() => void list.refetch()}
      />

      {list.list && total === 0 ? <p className="status">Нічого не знайдено.</p> : null}

      {list.list && total !== 0 && rows.length === 0 ? (
        <p className="status">На цій сторінці немає записів.</p>
      ) : null}

      {rows.length > 0 ? <WebhookTable webhooks={rows} listSearch={list.listSearch} /> : null}

      {list.list && total !== 0 ? (
        <WebhookPager current={current} last={last} total={total ?? 0} onPageChange={list.setPage} />
      ) : null}
    </AppShell>
  )
}
