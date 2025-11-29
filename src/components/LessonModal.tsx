import { useState, useEffect, useRef } from 'react'
import { createLesson, updateLesson, uploadLessonFile, type Lesson, type LessonCreate, type LessonUpdate } from '../api/lessons'

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (lesson: Lesson) => void
  courseId: number
  lesson?: Lesson | null // If provided, we're editing
}

export function LessonModal({ isOpen, onClose, onSuccess, courseId, lesson }: LessonModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'text' | 'video' | 'file'>('text')
  const [order, setOrder] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!lesson

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title)
      setContent(lesson.content || '')
      setType(lesson.type)
      setOrder(lesson.order)
    } else {
      setTitle('')
      setContent('')
      setType('text')
      setOrder(1)
    }
    setFile(null)
    setError(null)
    setUploadProgress(null)
  }, [lesson, isOpen])

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
      let savedLesson: Lesson

      if (isEditing && lesson) {
        // Update existing lesson
        const updateData: LessonUpdate = {
          title,
          content: content || undefined,
          type,
          order
        }
        savedLesson = await updateLesson(token, courseId, lesson.id, updateData)
      } else {
        // Create new lesson
        const createData: LessonCreate = {
          title,
          content: content || undefined,
          type,
          order
        }
        savedLesson = await createLesson(token, courseId, createData)
      }

      // Upload file if selected (for video or file type)
      if (file && (type === 'video' || type === 'file')) {
        setUploadProgress('Загрузка файла...')
        await uploadLessonFile(token, courseId, savedLesson.id, file)
        // Refresh lesson to get updated file_url
        savedLesson = { ...savedLesson, file_url: 'uploaded' }
      }

      onSuccess(savedLesson)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения урока')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type based on lesson type
      if (type === 'video') {
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
        if (!validVideoTypes.includes(selectedFile.type)) {
          setError('Пожалуйста, выберите видео файл (MP4, WebM, MOV, AVI, MKV)')
          return
        }
      }
      setFile(selectedFile)
      setError(null)
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
          <h2 className="text-xl font-bold text-[#222222]">
            {isEditing ? 'Редактировать урок' : 'Добавить урок'}
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
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Название урока *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-transparent outline-none"
              placeholder="Введите название урока"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Порядковый номер
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-transparent outline-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Тип урока
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  type === 'text'
                    ? 'border-[#EA5616] bg-[#EA5616]/5 text-[#EA5616]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Текст</span>
              </button>
              <button
                type="button"
                onClick={() => setType('video')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  type === 'video'
                    ? 'border-[#EA5616] bg-[#EA5616]/5 text-[#EA5616]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Видео</span>
              </button>
              <button
                type="button"
                onClick={() => setType('file')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  type === 'file'
                    ? 'border-[#EA5616] bg-[#EA5616]/5 text-[#EA5616]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Файл</span>
              </button>
            </div>
          </div>

          {/* Content (for text type) */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              {type === 'text' ? 'Содержимое урока' : 'Описание'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EA5616] focus:border-transparent outline-none resize-none"
              placeholder={type === 'text' ? 'Введите текст урока...' : 'Краткое описание урока...'}
            />
          </div>

          {/* File Upload (for video/file types) */}
          {(type === 'video' || type === 'file') && (
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-2">
                {type === 'video' ? 'Видео файл' : 'Прикрепить файл'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={type === 'video' ? 'video/*' : '*'}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#EA5616] transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {type === 'video'
                        ? 'Нажмите для загрузки видео (MP4, WebM, MOV)'
                        : 'Нажмите для загрузки файла'}
                    </p>
                  </>
                )}
              </div>
              {lesson?.file_url && !file && (
                <p className="mt-2 text-sm text-green-600">
                  Файл уже загружен. Выберите новый файл для замены.
                </p>
              )}
            </div>
          )}

          {uploadProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
              {uploadProgress}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-3 bg-[#EA5616] text-white rounded-lg font-medium hover:bg-[#d14a10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
