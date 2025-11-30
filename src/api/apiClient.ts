import { API_BASE } from './config'

/**
 * Handle 401 Unauthorized errors by clearing tokens and redirecting to login
 */
export function handleUnauthorized(): never {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/'
  throw new Error('Сессия истекла')
}

/**
 * Wrapper for fetch that handles 401 errors globally
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('access_token')

  const headers: HeadersInit = {
    ...options.headers,
  }

  if (token && !options.headers?.hasOwnProperty('Authorization')) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  return response
}

/**
 * Check if error is an authentication error and handle redirect
 */
export function checkAuthError(error: unknown): boolean {
  if (error instanceof Response && error.status === 401) {
    handleUnauthorized()
    return true
  }

  if (error instanceof Error && error.message.includes('401')) {
    handleUnauthorized()
    return true
  }

  return false
}
