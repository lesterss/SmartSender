import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { setSessionEndHandler } from '../api/client'
import { finishSession } from './finishSession'

export function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    setSessionEndHandler(() => {
      finishSession()
      void navigate('/login', { replace: true })
    })
    return () => setSessionEndHandler(() => {})
  }, [navigate])

  return <Outlet />
}
