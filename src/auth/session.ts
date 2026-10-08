type AuthSnapshot = {
  authenticated: boolean
}

let deviceSessionToken: string | null = null
let snapshot: AuthSnapshot = { authenticated: false }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAuthSnapshot() {
  return snapshot
}

export function isAuthenticated() {
  return snapshot.authenticated
}

export function getDeviceSessionToken() {
  return deviceSessionToken
}

export function setDeviceSessionToken(token: string) {
  deviceSessionToken = token
}

export function markAuthenticated() {
  snapshot = { authenticated: true }
  emit()
}

export function clearSession() {
  deviceSessionToken = null
  if (!snapshot.authenticated) return
  snapshot = { authenticated: false }
  emit()
}
