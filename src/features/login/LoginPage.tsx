import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { login } from '../../api/auth'
import { isApiError } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { TextField } from '../forms/Field'

function returnPath(state: unknown) {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/webhooks'
  const from = state.from
  if (typeof from !== 'object' || from === null || !('pathname' in from)) return '/webhooks'

  const pathname = from.pathname
  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return '/webhooks'
  }
  if (pathname === '/login') return '/webhooks'
  return `${pathname}${search}`
}

export function LoginPage() {
  const { authenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState('')

  if (authenticated) {
    return <Navigate to={returnPath(location.state)} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setFieldErrors({})
    setFormError('')
    try {
      await login(email, password)
      void navigate(returnPath(location.state), { replace: true })
    } catch (error) {
      if (isApiError(error) && error.payload) {
        setFieldErrors(error.payload)
      } else if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError('Не вдалося увійти.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-screen">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>Вхід</h1>
        <p className="muted">Увійдіть, щоб керувати вебхуками.</p>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          error={fieldErrors.email}
          onChange={setEmail}
        />
        <TextField
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
        />
        {formError ? (
          <p className="field-error" role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" disabled={pending}>
          {pending ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
    </main>
  )
}
