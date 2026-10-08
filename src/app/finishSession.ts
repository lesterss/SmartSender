import { clearSession } from '../auth/session'
import { queryClient } from './queryClient'

export function finishSession() {
  clearSession()
  queryClient.clear()
}
