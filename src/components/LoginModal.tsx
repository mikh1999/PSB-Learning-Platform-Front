import { useState, useEffect, useCallback } from 'react'
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#F8F8F8] rounded-2xl shadow-2xl w-full max-w-[940px] mx-4 overflow-hidden relative"
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

        <div className="flex min-h-[500px]">
          {/* Left side - Logo with decorative dots */}
          <div className="hidden md:flex w-1/2 items-center justify-center relative p-12">
            {/* Decorative dots */}
            <div className="absolute top-16 left-24 w-5 h-5 bg-[#EA5616] rounded-full" />
            <div className="absolute top-12 right-32 w-3 h-3 bg-[#5B5FC7] rounded-full" />
            <div className="absolute top-28 left-40 w-2 h-2 bg-[#EA5616] rounded-full" />
            <div className="absolute bottom-20 left-16 w-3 h-3 bg-[#5B5FC7] rounded-full" />
            <div className="absolute bottom-16 left-32 w-4 h-4 bg-[#5B5FC7] rounded-full" />
            <div className="absolute bottom-24 right-24 w-5 h-5 bg-[#5B5FC7] rounded-full" />
            <div className="absolute bottom-20 right-16 w-2 h-2 bg-[#EA5616] rounded-full" />
            <div className="absolute bottom-32 right-32 w-3 h-3 bg-[#EA5616] rounded-full" />

            {/* PSB Logo */}
            <img
              src="/psb-logo-3d.png"
              alt="ПСБ"
              className="w-80 h-auto object-contain"
            />
          </div>

          {/* Right side - Login form */}
          <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
            <h2 className="text-[36px] md:text-[42px] font-medium text-black mb-10 font-['Montserrat']">
              Вход в аккаунт
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[20px] font-semibold text-[#B4B4B4] mb-4 font-['Montserrat']">
                  Почта
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-5 bg-white rounded-lg text-[18px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                  placeholder="Введите почту"
                />
              </div>

              <div>
                <label className="block text-[20px] font-semibold text-[#B4B4B4] mb-4 font-['Montserrat']">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-5 bg-white rounded-lg text-[18px] font-medium text-[#222222] placeholder-[#B4B4B4] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                  placeholder="Введите пароль"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#222222] hover:bg-[#333333] disabled:bg-gray-400 text-white text-[18px] font-medium rounded-lg transition-colors font-['Montserrat']"
                >
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="text-[16px] text-black underline hover:no-underline font-['Montserrat']"
                >
                  Забыли пароль?
                </button>
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-[16px] text-[#5B5FC7] hover:underline font-medium font-['Montserrat']"
                >
                  Регистрация
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
