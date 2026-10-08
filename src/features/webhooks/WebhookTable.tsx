import { Link } from 'react-router'
import type { Webhook } from '../../api/types'
import { webhookListLinkState } from './webhookNavigation'

type WebhookTableProps = {
  webhooks: Webhook[]
  listSearch: string
}

export function WebhookTable({ webhooks, listSearch }: WebhookTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Назва</th>
            <th scope="col">URL</th>
            <th scope="col">Активність</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((webhook) => (
            <tr key={webhook.id}>
              <td>
                <Link to={`/webhooks/${webhook.id}`} state={webhookListLinkState(listSearch)}>
                  {webhook.name}
                </Link>
              </td>
              <td className="url">{webhook.url}</td>
              <td>
                <span className={webhook.active ? 'badge on' : 'badge'}>
                  {webhook.active ? 'Активний' : 'Вимкнений'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type WebhookPagerProps = {
  current: number
  last: number
  total: number
  onPageChange: (page: number) => void
}

export function WebhookPager({ current, last, total, onPageChange }: WebhookPagerProps) {
  return (
    <div className="pager">
      <button type="button" onClick={() => onPageChange(current - 1)} disabled={current <= 1}>
        Назад
      </button>
      <span>
        Сторінка {current} з {last} · {total}
      </span>
      <button type="button" onClick={() => onPageChange(current + 1)} disabled={current >= last}>
        Далі
      </button>
    </div>
  )
}
