import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RootErrorBoundary() {
  const error = useRouteError()

  let title = 'Щось пішло не так'
  let detail = 'Сталася неочікувана помилка. Спробуйте ще раз або поверніться до списку.'

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Сторінку не знайдено' : `Помилка ${error.status}`
    detail =
      typeof error.data === 'string' && error.data
        ? error.data
        : error.statusText || detail
  } else if (error instanceof Error && error.message) {
    detail = error.message
  }

  return (
    <div className="login-screen">
      <div className="card login-card" role="alert">
        <h1>{title}</h1>
        <p className="muted">{detail}</p>
        <Link to="/webhooks">До вебхуків</Link>
      </div>
    </div>
  )
}
