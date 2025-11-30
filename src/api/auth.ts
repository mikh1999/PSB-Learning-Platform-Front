import { API_BASE } from './config'
import { handleUnauthorized } from './apiClient'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher'
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher'
  is_active: boolean
  avatar_url?: string
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: data.email,
      password: data.password,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Ошибка входа')
  }

  return response.json()
}

export async function register(data: RegisterRequest): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Ошибка регистрации')
  }

  return response.json()
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  if (!response.ok) {
    throw new Error('Не авторизован')
  }

  return response.json()
}
