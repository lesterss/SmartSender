import { getFingerprint } from '../auth/fingerprint'
import {
  clearSession,
  getDeviceSessionToken,
  markAuthenticated,
  setDeviceSessionToken,
} from '../auth/session'
import { api, resetSessionGuard } from './client'
import { ApiError } from './errors'

const CAPTCHA_HEADER = { 'X-Captcha-Token': 'test-captcha' }

export async function login(email: string, password: string) {
  const fingerprint = getFingerprint()
  const response = await api.post<{ device_session_token: string }>(
    '/auth/login',
    { email, password, fingerprint },
    CAPTCHA_HEADER,
  )

  setDeviceSessionToken(response.device_session_token)
  const deviceSessionToken = getDeviceSessionToken()
  if (!deviceSessionToken) {
    clearSession()
    throw new ApiError(422, 'ValidationException', 'The given data was invalid.', {
      device_session_token: ['The device session token is invalid.'],
    })
  }

  try {
    await api.post('/auth/token/issue', {
      device_session_token: deviceSessionToken,
      fingerprint,
    })
  } catch (error) {
    clearSession()
    throw error
  }

  resetSessionGuard()
  markAuthenticated()
}

export function revokeSession() {
  return api.post<void>('/auth/token/revoke', { fingerprint: getFingerprint() })
}
