import { useState, useEffect } from 'react'
import { createAssignment, updateAssignment, type Assignment, type AssignmentCreate, type AssignmentUpdate } from '../api/assignments'

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  courseId: number
  lessonId: number
  assignment?: Assignment | null // If provided, we're editing
}

export function AssignmentModal({ isOpen, onClose, onSuccess, courseId, lessonId, assignment }: AssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [maxScore, setMaxScore] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!assignment

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title)
      setDescription(assignment.description || '')
      setDeadline(assignment.deadline ? assignment.deadline.slice(0, 16) : '')
      setMaxScore(assignment.max_score)
    } else {
      setTitle('')
      setDescription('')
      setDeadline('')
      setMaxScore(100)
    }
    setError(null)
  }, [assignment, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('Требуется авторизация')
      setLoading(false)
      return
    }

    try {
      // Format deadline without timezone (backend expects naive datetime)
      const formatDeadline = (d: string) => {
        if (!d) return undefined
        const date = new Date(d)
        return date.toISOString().slice(0, 19) // Remove 'Z' suffix
      }

      if (isEditing && assignment) {
        const updateData: AssignmentUpdate = {
          title,
          description: description || undefined,
          deadline: formatDeadline(deadline),
          max_score: maxScore
        }
        await updateAssignment(token, courseId, lessonId, assignment.id, updateData)
      } else {
        const createData: AssignmentCreate = {
          title,
          description: description || undefined,
          deadline: formatDeadline(deadline),
          max_score: maxScore
        }
        await createAssignment(token, courseId, lessonId, createData)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения задания')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#222222] font-['Montserrat']">
            {isEditing ? 'Редактировать задание' : 'Добавить задание'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2 font-['Montserrat']">
              Название задания *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none font-['Montserrat']"
              placeholder="Введите название задания"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2 font-['Montserrat']">
              Описание задания
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none resize-none font-['Montserrat']"
              placeholder="Опишите, что нужно сделать..."
            />
          </div>

          {/* Max Score */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2 font-['Montserrat']">
              Максимальный балл
            </label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
              min={1}
              max={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none font-['Montserrat']"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2 font-['Montserrat']">
              Срок сдачи (необязательно)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none font-['Montserrat']"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors font-['Montserrat']"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-3 bg-[#2C2D84] text-white rounded-lg font-medium hover:bg-[#3d3e95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['Montserrat']"
            >
              {loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
