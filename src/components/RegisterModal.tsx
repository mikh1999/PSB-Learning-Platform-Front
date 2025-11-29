import { useState } from 'react'
import { Modal } from './Modal'
import { register, login, type AuthResponse } from '../api/auth'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (auth: AuthResponse) => void
  onSwitchToLogin: () => void
}

export function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'student' as 'student' | 'teacher',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      })

      const auth = await login({
        email: formData.email,
        password: formData.password,
      })

      localStorage.setItem('access_token', auth.access_token)
      localStorage.setItem('refresh_token', auth.refresh_token)
      onSuccess(auth)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Регистрация">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Имя
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
              placeholder="Иван"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Фамилия
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
              placeholder="Иванов"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="example@mail.ru"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Я являюсь
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow bg-white text-[#222222]"
          >
            <option value="student">Студентом</option>
            <option value="teacher">Преподавателем</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Пароль
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Подтвердите пароль
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[56px] bg-[#EA5616] hover:bg-[#d14a10] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#EA5616] hover:underline font-medium"
          >
            Войти
          </button>
        </p>
      </form>
    </Modal>
  )
}
