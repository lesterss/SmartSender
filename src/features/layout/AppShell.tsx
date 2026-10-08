import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { revokeSession } from '../../api/auth'
import { fetchMe, meQueryKey } from '../../api/webhooks'
import { finishSession } from '../../app/finishSession'

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const me = useQuery({ queryKey: meQueryKey, queryFn: fetchMe })

  async function onLogout() {
    setPending(true)
    try {
      await revokeSession()
    } finally {
      finishSession()
      void navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>Smart Sender</strong>
        <div className="topbar-actions">
          <span>{me.data?.name ?? me.data?.email ?? ''}</span>
          <button type="button" className="secondary" onClick={() => void onLogout()} disabled={pending}>
            {pending ? 'Вихід…' : 'Вийти'}
          </button>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  )
}
