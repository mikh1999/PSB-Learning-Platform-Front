import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getCourse, type Course } from '../api/courses'
import { getCourseLessons, deleteLesson, getVideoStreamUrl, getFileDownloadUrl, getFileType, getFileExtension, type Lesson } from '../api/lessons'
import { getLessonAssignments, type Assignment } from '../api/assignments'
import { LessonModal } from '../components/LessonModal'

// Extended lesson with assignments loaded
interface LessonWithAssignments extends Lesson {
  assignments: Assignment[]
}

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<LessonWithAssignments[]>([])
  const [selectedLesson, setSelectedLesson] = useState<LessonWithAssignments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTeacher] = useState(true) // TODO: get from auth context

  // Modal states
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deleteConfirmLesson, setDeleteConfirmLesson] = useState<LessonWithAssignments | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLessons = async (token: string, cId: number) => {
    const lessonsData = await getCourseLessons(token, cId)

    // Fetch assignments for each lesson
    const lessonsWithAssignments: LessonWithAssignments[] = await Promise.all(
      lessonsData.items.map(async (lesson) => {
        try {
          const assignmentsData = await getLessonAssignments(token, cId, lesson.id)
          return { ...lesson, assignments: assignmentsData.items }
        } catch {
          return { ...lesson, assignments: [] }
        }
      })
    )

    // Sort by order
    lessonsWithAssignments.sort((a, b) => a.order - b.order)
    return lessonsWithAssignments
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token || !courseId) {
      setError('Требуется авторизация')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch course details
        const courseData = await getCourse(token, parseInt(courseId))
        setCourse(courseData)

        // Fetch lessons
        const lessonsWithAssignments = await fetchLessons(token, parseInt(courseId))
        setLessons(lessonsWithAssignments)

        // Auto-select first lesson
        if (lessonsWithAssignments.length > 0) {
          setSelectedLesson(lessonsWithAssignments[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки курса')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  // Handle lesson selection
  const handleSelectLesson = (lesson: LessonWithAssignments) => {
    setSelectedLesson(lesson)
  }

  // Handle lesson creation/update success
  const handleLessonSuccess = async () => {
    const token = localStorage.getItem('access_token')
    if (!token || !courseId) return

    try {
      const updatedLessons = await fetchLessons(token, parseInt(courseId))
      setLessons(updatedLessons)

      // If editing, update selected lesson
      if (editingLesson) {
        const updated = updatedLessons.find(l => l.id === editingLesson.id)
        if (updated) setSelectedLesson(updated)
      } else if (updatedLessons.length > 0) {
        // Select the last added lesson (highest order)
        const lastLesson = updatedLessons[updatedLessons.length - 1]
        setSelectedLesson(lastLesson)
      }
    } catch (err) {
      console.error('Error refreshing lessons:', err)
    }

    setEditingLesson(null)
  }

  // Handle lesson deletion
  const handleDeleteLesson = async () => {
    if (!deleteConfirmLesson || !courseId) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    setDeleting(true)
    try {
      await deleteLesson(token, parseInt(courseId), deleteConfirmLesson.id)

      // Refresh lessons
      const updatedLessons = await fetchLessons(token, parseInt(courseId))
      setLessons(updatedLessons)

      // Clear selection if deleted lesson was selected
      if (selectedLesson?.id === deleteConfirmLesson.id) {
        setSelectedLesson(updatedLessons.length > 0 ? updatedLessons[0] : null)
      }

      setDeleteConfirmLesson(null)
    } catch (err) {
      console.error('Error deleting lesson:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Open modal for new lesson
  const openNewLessonModal = () => {
    setEditingLesson(null)
    setShowLessonModal(true)
  }

  // Open modal for editing
  const openEditLessonModal = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowLessonModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EA5616] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <a href="/" className="text-[#EA5616] hover:underline">
            Вернуться на главную
          </a>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <p className="text-xl text-gray-500">Курс не найден</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header - Figma style */}
      <header className="px-[28px] lg:px-[42px] 2xl:px-[56px]">
        <div className="flex items-center justify-between h-[120px] lg:h-[140px] 2xl:h-[156px]">
          {/* Logo */}
          <a href="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="ПСБ" className="h-[100px] lg:h-[120px] 2xl:h-[156px] w-auto" />
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-[20px] lg:gap-[28px] 2xl:gap-[37px]">
            <a href="/#courses" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              Выбрать курс
            </a>
            <a href="/#about" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              О нас
            </a>
            <a href="/#support" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              Поддержка
            </a>
          </nav>

          {/* Empty space for layout balance */}
          <div className="w-[132px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-[28px] lg:px-[42px] 2xl:px-[56px] pb-[50px]">
        {/* Back link */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#EA5616] text-[16px] font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к курсам
          </a>
        </div>

        {/* Two-column layout - Figma style */}
        <div className="flex gap-6">
          {/* Left Panel - Course Structure */}
          <div className="w-[350px] lg:w-[400px] 2xl:w-[437px] shrink-0">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#222222] font-['Montserrat']">
                  Структура курса
                </h2>
                <p className="text-[16px] font-medium text-[#EA5616] mt-1 font-['Montserrat']">
                  {course.title}
                </p>
              </div>

              {/* Lessons List */}
              <div className="space-y-2">
                {lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-[#FFF3F0]'
                          : 'bg-[#F8F9FA] hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-[16px] font-medium font-['Montserrat'] ${
                        selectedLesson?.id === lesson.id
                          ? 'text-[#EA5616]'
                          : 'text-[#222222]'
                      }`}>
                        Урок {index + 1}: {lesson.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Уроки пока не добавлены</p>
                  </div>
                )}
              </div>

              {/* Add lesson button - Figma style */}
              {isTeacher && (
                <button
                  onClick={openNewLessonModal}
                  className="w-full mt-6 h-[53px] border border-dashed border-[#222222] rounded-lg text-[20px] font-medium text-[#222222] hover:border-[#EA5616] hover:text-[#EA5616] transition-colors font-['Montserrat']"
                >
                  Добавить урок +
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Lesson Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm min-h-[600px]">
              {selectedLesson ? (
                <>
                  {/* Lesson Header */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                    <div className="flex-1">
                      <h1 className="text-[22px] lg:text-[26px] font-extrabold text-[#222222] font-['Montserrat']">
                        Урок {lessons.findIndex(l => l.id === selectedLesson.id) + 1}: {selectedLesson.title}
                      </h1>
                      {selectedLesson.content && (
                        <p className="text-[14px] text-[#666666] mt-2 font-['Montserrat']">
                          {selectedLesson.content}
                        </p>
                      )}
                    </div>
                    {isTeacher && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] rounded-md text-[14px] text-[#666666] hover:bg-gray-200 transition-colors font-['Montserrat']">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Статистика урока
                      </button>
                    )}
                  </div>

                  {/* Materials Section */}
                  <div>
                    <h2 className="text-[18px] font-bold text-[#222222] mb-4 font-['Montserrat']">
                      Материалы урока
                    </h2>

                    <div className="space-y-4">
                      {/* File material - detect type and show appropriate preview */}
                      {selectedLesson.content && courseId && (() => {
                        const fileType = getFileType(selectedLesson.content)
                        const fileExt = getFileExtension(selectedLesson.content)
                        const token = localStorage.getItem('access_token') || undefined

                        // Video preview
                        if (fileType === 'video') {
                          return (
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-[#EA5616]/10 rounded-lg flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-[#EA5616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                    Лекция: {selectedLesson.title}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-2 text-[12px] text-[#999999] font-['Montserrat']">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>Видео · {fileExt}</span>
                                  </div>
                                </div>
                                {isTeacher && (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openEditLessonModal(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors" title="Редактировать">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => setDeleteConfirmLesson(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 bg-[#222222] rounded-xl overflow-hidden">
                                <video key={selectedLesson.id} controls className="w-full aspect-video" src={getVideoStreamUrl(parseInt(courseId), selectedLesson.id, token)} poster="/video-poster.png">
                                  Ваш браузер не поддерживает видео
                                </video>
                              </div>
                            </div>
                          )
                        }

                        // PDF preview
                        if (fileType === 'pdf') {
                          return (
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                    Документ: {selectedLesson.title}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-2 text-[12px] text-[#999999] font-['Montserrat']">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>PDF документ</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a href={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)} target="_blank" rel="noopener noreferrer" className="p-2 rounded text-[#666666] hover:text-[#2C2D84] hover:bg-[#2C2D84]/10 transition-colors" title="Скачать">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </a>
                                  {isTeacher && (
                                    <>
                                      <button onClick={() => openEditLessonModal(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors" title="Редактировать">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                      <button onClick={() => setDeleteConfirmLesson(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* PDF Viewer */}
                              <div className="mt-4 bg-gray-100 rounded-xl overflow-hidden">
                                <iframe
                                  key={selectedLesson.id}
                                  src={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)}
                                  className="w-full h-[600px] border-0"
                                  title={`PDF: ${selectedLesson.title}`}
                                />
                              </div>
                            </div>
                          )
                        }

                        // Image preview
                        if (fileType === 'image') {
                          return (
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                    Изображение: {selectedLesson.title}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-2 text-[12px] text-[#999999] font-['Montserrat']">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Изображение · {fileExt}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a href={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)} target="_blank" rel="noopener noreferrer" className="p-2 rounded text-[#666666] hover:text-[#2C2D84] hover:bg-[#2C2D84]/10 transition-colors" title="Открыть">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  </a>
                                  {isTeacher && (
                                    <>
                                      <button onClick={() => openEditLessonModal(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors" title="Редактировать">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                      <button onClick={() => setDeleteConfirmLesson(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Image Viewer */}
                              <div className="mt-4 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-4">
                                <img
                                  key={selectedLesson.id}
                                  src={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)}
                                  alt={selectedLesson.title}
                                  className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                                />
                              </div>
                            </div>
                          )
                        }

                        // Document/Other file preview (download only)
                        if (fileType === 'document' || fileType === 'unknown') {
                          return (
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-[#2C2D84]/10 rounded-lg flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-[#2C2D84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                    Файл: {selectedLesson.title}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-2 text-[12px] text-[#999999] font-['Montserrat']">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Документ · {fileExt}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a href={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)} target="_blank" rel="noopener noreferrer" className="p-2 rounded text-[#666666] hover:text-[#2C2D84] hover:bg-[#2C2D84]/10 transition-colors" title="Скачать">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </a>
                                  {isTeacher && (
                                    <>
                                      <button onClick={() => openEditLessonModal(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors" title="Редактировать">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                      <button onClick={() => setDeleteConfirmLesson(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Download prompt */}
                              <div className="mt-4 bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-[14px] text-[#666666] font-['Montserrat'] mb-3">Предпросмотр недоступен</p>
                                <a
                                  href={getFileDownloadUrl(parseInt(courseId), selectedLesson.id, token)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-[#2C2D84] hover:bg-[#3d3e95] text-white text-[14px] font-medium rounded-lg transition-colors font-['Montserrat'] flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Скачать файл
                                </a>
                              </div>
                            </div>
                          )
                        }

                        return null
                      })()}

                      {/* Text content - show if no file attached */}
                      {selectedLesson.type === 'text' && !selectedLesson.content?.startsWith('lessons/') && selectedLesson.content && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[#2C2D84]/10 rounded-lg flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5 text-[#2C2D84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                Текстовый материал
                              </h3>
                              <div className="text-[14px] text-[#666666] mt-2 font-['Montserrat'] whitespace-pre-wrap">
                                {selectedLesson.content}
                              </div>
                            </div>
                            {isTeacher && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditLessonModal(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => setDeleteConfirmLesson(selectedLesson)} className="p-2 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assignments */}
                      {selectedLesson.assignments.length > 0 && selectedLesson.assignments.map((assignment, idx) => (
                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[#2C2D84]/10 rounded-lg flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5 text-[#2C2D84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[16px] font-bold text-[#222222] font-['Montserrat']">
                                Задание {idx + 1}: {assignment.title}
                              </h3>
                              {assignment.description && (
                                <p className="text-[14px] text-[#666666] mt-1 font-['Montserrat']">
                                  {assignment.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-[12px] text-[#999999] font-['Montserrat']">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-[#EA5616]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  Макс. балл: {assignment.max_score}
                                </span>
                                {assignment.deadline && (
                                  <span className="flex items-center gap-1 text-[#EA5616]">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Срок: {new Date(assignment.deadline).toLocaleDateString('ru-RU')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isTeacher && (
                              <div className="flex items-center gap-1">
                                <button className="p-2 rounded text-[#666666] hover:text-[#EA5616] hover:bg-[#EA5616]/10 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button className="p-2 rounded text-[#666666] hover:text-[#2C2D84] hover:bg-[#2C2D84]/10 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add assignment button for teachers - Figma style */}
                      {isTeacher && (
                        <button className="w-full h-[53px] bg-[#2C2D84] hover:bg-[#3d3e95] rounded-lg text-[20px] font-medium text-white transition-colors font-['Montserrat']">
                          Добавить задание
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg font-['Montserrat']">Выберите урок из структуры курса</p>
                    {isTeacher && lessons.length === 0 && (
                      <button
                        onClick={openNewLessonModal}
                        className="mt-4 px-6 py-3 bg-[#EA5616] text-white rounded-lg hover:bg-[#d14a10] transition-colors font-['Montserrat']"
                      >
                        Создать первый урок
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Figma style */}
      <footer className="bg-[#222222] px-[28px] lg:px-[42px] 2xl:px-[56px] py-[55px] lg:py-[82px] 2xl:py-[110px] mt-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-[40px] lg:gap-[100px]">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/psb-logo-white.png"
              alt="ПСБ"
              className="h-[80px] lg:h-[140px] 2xl:h-[200px] w-auto"
            />
          </div>

          {/* Footer Links */}
          <div className="flex flex-col lg:flex-row gap-[40px] lg:gap-[75px] 2xl:gap-[100px]">
            {/* Column 1 */}
            <div className="flex flex-col gap-[25px] lg:gap-[37px] 2xl:gap-[50px]">
              <a href="#" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Договор-оферта
              </a>
              <a href="#" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Все права защищены
              </a>
              <span className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium">
                2025
              </span>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-[25px] lg:gap-[37px] 2xl:gap-[50px]">
              <a href="/#about" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                О нас
              </a>
              <a href="/#support" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Поддержка
              </a>
              <a href="/#courses" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Курсы
              </a>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-[25px] lg:gap-[37px] 2xl:gap-[50px]">
              <a href="#" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Контакты
              </a>
              <a href="#" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Стажировки
              </a>
              <a href="#" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Приложение
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lesson Modal */}
      {courseId && (
        <LessonModal
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false)
            setEditingLesson(null)
          }}
          onSuccess={handleLessonSuccess}
          courseId={parseInt(courseId)}
          lesson={editingLesson}
        />
      )}

      {/* Delete Confirmation Modal - Figma style */}
      {deleteConfirmLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setDeleteConfirmLesson(null)}
          />
          <div className="relative bg-[#F8F8F8] rounded-2xl w-full max-w-md mx-4 p-8">
            <h3 className="text-[22px] font-bold text-[#222222] mb-4 font-['Montserrat']">
              Удалить урок?
            </h3>
            <p className="text-[14px] text-[#666666] mb-6 font-['Montserrat']">
              Вы уверены, что хотите удалить урок "{deleteConfirmLesson.title}"? Это действие нельзя отменить.
              {deleteConfirmLesson.assignments.length > 0 && (
                <span className="block mt-2 text-red-500">
                  Все {deleteConfirmLesson.assignments.length} заданий также будут удалены.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmLesson(null)}
                className="px-6 py-3 bg-white rounded-lg text-[14px] font-medium text-[#222222] hover:bg-gray-100 transition-colors font-['Montserrat']"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteLesson}
                disabled={deleting}
                className="px-6 py-3 bg-red-500 text-white rounded-lg text-[14px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50 font-['Montserrat']"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
