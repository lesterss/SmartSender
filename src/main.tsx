import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import './index.css'

async function bootstrap() {
  const { startMocking } = await import('./mocks/browser.ts')
  const mocking = await startMocking()
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element is missing.')
  if (mocking !== 'ready') {
    if (mocking === 'failed') root.textContent = 'Не вдалося увімкнути мок API. Оновіть сторінку.'
    return
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
