import { Navigate, createBrowserRouter } from 'react-router'
import { LoginPage } from '../features/login/LoginPage'
import { WebhookEditPage } from '../features/webhooks/WebhookEditPage'
import { WebhookListPage } from '../features/webhooks/WebhookListPage'
import { RequireAuth } from './RequireAuth'
import { RootErrorBoundary } from './RootErrorBoundary'
import { RootLayout } from './RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/webhooks', element: <WebhookListPage /> },
          { path: '/webhooks/:id', element: <WebhookEditPage /> },
        ],
      },
      { path: '/', element: <Navigate to="/webhooks" replace /> },
      { path: '*', element: <Navigate to="/webhooks" replace /> },
    ],
  },
])
