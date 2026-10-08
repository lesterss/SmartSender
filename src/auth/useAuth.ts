import { useSyncExternalStore } from 'react'
import { getAuthSnapshot, subscribeAuth } from './session'

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot)
}
