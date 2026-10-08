const STORAGE_KEY = 'smartsender.device_fingerprint'
const FINGERPRINT_PATTERN = /^[0-9a-f]{32}$/

export function getFingerprint(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing && FINGERPRINT_PATTERN.test(existing)) return existing

  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const next = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  localStorage.setItem(STORAGE_KEY, next)
  return next
}
