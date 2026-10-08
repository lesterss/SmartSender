import type { ApiErrorBody, ApiErrorType } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly type: ApiErrorType
  readonly payload?: Record<string, string[]>

  constructor(
    status: number,
    type: ApiErrorType,
    message: string,
    payload?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.type = type
    this.payload = payload
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function statusToType(status: number): ApiErrorType {
  switch (status) {
    case 400:
      return 'BadRequestException'
    case 401:
      return 'AuthenticationException'
    case 404:
      return 'NotFoundException'
    case 419:
      return 'TokenMismatchException'
    case 422:
      return 'ValidationException'
    default:
      return 'BadRequestException'
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = value.error
  if (typeof error !== 'object' || error === null) return false
  if (!('type' in error) || !('message' in error)) return false
  return typeof error.type === 'string' && typeof error.message === 'string'
}

export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (isErrorBody(body)) {
      return new ApiError(response.status, body.error.type, body.error.message, body.error.payload)
    }
  } catch {
    // Тіло порожнє або не JSON — лишаємо статус відповіді.
  }

  return new ApiError(
    response.status,
    statusToType(response.status),
    response.statusText || 'Request failed.',
  )
}
