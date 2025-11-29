import { useState } from 'react'
import { Modal } from './Modal'
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать курс">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Название курса
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222]"
            placeholder="Введите название курса"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-2">
            Описание (необязательно)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-[#EA5616] outline-none transition-shadow text-[#222222] resize-none"
            placeholder="Опишите содержание курса"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full h-[56px] bg-[#EA5616] hover:bg-[#d14a10] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Создание...' : 'Создать курс'}
        </button>
      </form>
    </Modal>
  )
}
