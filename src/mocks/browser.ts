import { setupWorker } from 'msw/browser'
import { setUnmockedHandler } from '../api/client'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

const RECOVER_KEY = 'smartsender.msw-recover'

function reactivateMocking() {
  const controller = navigator.serviceWorker.controller
  if (!controller) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(finish, 400)

    function finish() {
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('message', onMessage)
      resolve()
    }

    function onMessage(event: MessageEvent) {
      const data: unknown = event.data
      if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'MOCKING_ENABLED') {
        finish()
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    controller.postMessage('MOCK_ACTIVATE')
  })
}

async function isMocked() {
  const response = await fetch(new URL('/csrf', location.origin), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
  })
  return response.status === 204 && Boolean(response.headers.get('X-CSRF-TOKEN'))
}

async function recoverMocking() {
  if (sessionStorage.getItem(RECOVER_KEY) === '1') return
  sessionStorage.setItem(RECOVER_KEY, '1')
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
  location.reload()
}

export async function startMocking(): Promise<'ready' | 'reloading' | 'failed'> {
  await worker.start({ onUnhandledFrame: 'bypass' })
  setUnmockedHandler(async (giveUp) => {
    if (!giveUp) {
      await reactivateMocking()
      return
    }
    await recoverMocking()
  })

  if (!(await isMocked())) await reactivateMocking()
  if (!(await isMocked())) {
    if (sessionStorage.getItem(RECOVER_KEY) === '1') {
      sessionStorage.removeItem(RECOVER_KEY)
      return 'failed'
    }
    await recoverMocking()
    return 'reloading'
  }

  sessionStorage.removeItem(RECOVER_KEY)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    void reactivateMocking()
  })
  return 'ready'
}
