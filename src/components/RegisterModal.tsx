import { useState, useEffect, useCallback } from 'react'
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

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#F8F8F8] rounded-2xl shadow-2xl w-full max-w-[560px] mx-4 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#222222] hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10 md:p-12">
          <h2 className="text-[32px] md:text-[36px] font-medium text-black mb-8 font-['Montserrat']">
            Создать аккаунт
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                  Имя
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                  Фамилия
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                  placeholder="Иванов"
                />
              </div>
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                Почта
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                placeholder="Введите почту"
              />
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                Я являюсь
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
              >
                <option value="student">Студентом</option>
                <option value="teacher">Преподавателем</option>
              </select>
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                placeholder="Введите пароль"
              />
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#B4B4B4] mb-3 font-['Montserrat']">
                Подтвердите пароль
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white rounded-lg text-[16px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                placeholder="Повторите пароль"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#222222] hover:bg-[#333333] disabled:bg-gray-400 text-white text-[18px] font-medium rounded-lg transition-colors font-['Montserrat']"
              >
                {loading ? 'Регистрация...' : 'Создать аккаунт'}
              </button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <span className="text-[16px] text-[#222222] font-['Montserrat']">
                Уже есть аккаунт?{' '}
              </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[16px] text-[#5B5FC7] hover:underline font-medium font-['Montserrat'] ml-1"
              >
                Войти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
