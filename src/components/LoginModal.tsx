import { useState } from 'react'
import { Modal } from './Modal'
import { login, type AuthResponse } from '../api/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (auth: AuthResponse) => void
  onSwitchToRegister: () => void
}

export function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const auth = await login({ email, password })
      localStorage.setItem('access_token', auth.access_token)
      localStorage.setItem('refresh_token', auth.refresh_token)
      onSuccess(auth)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вход">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="example@mail.ru"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[56px] bg-[#222222] hover:bg-[#333333] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Нет аккаунта?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#EA5616] hover:underline font-medium"
          >
            Зарегистрироваться
          </button>
        </p>
      </form>
    </Modal>
  )
}
