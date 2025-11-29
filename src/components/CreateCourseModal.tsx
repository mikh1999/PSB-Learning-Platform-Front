import { useState, useEffect, useCallback } from 'react'
import { createCourse, type Course } from '../api/courses'

interface CreateCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (course: Course) => void
}

export function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
  }, [])

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

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('Необходимо авторизоваться')
      setLoading(false)
      return
    }

    try {
      const course = await createCourse(token, {
        title,
        description: description || undefined,
        status: 'draft'
      })
      onSuccess(course)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания курса')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-[#F8F8F8] rounded-2xl shadow-2xl w-full max-w-[586px] mx-4 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-[#222222] hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10">
          {/* Title - Figma: 25px Bold */}
          <h2 className="text-[22px] md:text-[25px] font-bold text-[#222222] mb-8 font-['Montserrat']">
            Создание курса
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Course title field */}
            <div>
              <label className="block text-[16px] font-medium text-[#222222] mb-3 font-['Montserrat']">
                Название курса <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white rounded-lg text-[14px] text-[#222222] placeholder-[#757575] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat']"
                placeholder="Введите название"
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-[16px] font-medium text-[#222222] mb-3 font-['Montserrat']">
                Описание курса
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white rounded-lg text-[14px] text-[#222222] placeholder-[#757575] outline-none focus:ring-2 focus:ring-[#5B5FC7] transition-shadow font-['Montserrat'] resize-none"
                placeholder="Опишите содержание курса"
              />
            </div>

            {/* Buttons - Figma style */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-[#222222] text-[14px] font-medium rounded-lg transition-colors font-['Montserrat']"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-8 py-3 bg-[#222222] hover:bg-[#333333] disabled:bg-gray-400 text-white text-[14px] font-medium rounded-lg transition-colors font-['Montserrat']"
              >
                {loading ? 'Создание...' : 'Далее'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
