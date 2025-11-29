import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getCourse, type Course } from '../api/courses'
import { getCourseLessons, deleteLesson, getVideoStreamUrl, type Lesson } from '../api/lessons'
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

  // Format deadline date
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Get assignment count text in Russian
  const getAssignmentCountText = (count: number) => {
    if (count === 1) return '1 задание'
    if (count >= 2 && count <= 4) return `${count} задания`
    return `${count} заданий`
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
    <div className="min-h-screen bg-[#F8F8F8] flex">
      {/* Left Sidebar - Course Structure */}
      <aside className="w-[280px] lg:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <a href="/" className="text-[#EA5616] text-sm font-medium hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к курсам
          </a>
          <h2 className="text-lg lg:text-xl font-bold text-[#222222] mt-3">
            Структура курса
          </h2>
          <p className="text-sm text-[#EA5616] mt-1 line-clamp-2">
            {course.title}
          </p>
        </div>

        {/* Lessons List */}
        <nav className="flex-1 overflow-y-auto p-4 lg:p-6">
          {lessons.length > 0 ? (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`group relative rounded-xl transition-colors ${
                    selectedLesson?.id === lesson.id
                      ? 'bg-[#EA5616]/10 border-l-4 border-[#EA5616]'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => handleSelectLesson(lesson)}
                    className="w-full text-left p-3 lg:p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Lesson number circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-[#EA5616] text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {lesson.order}
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm lg:text-base font-medium leading-tight ${
                          selectedLesson?.id === lesson.id ? 'text-[#EA5616]' : 'text-[#222222]'
                        }`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {lesson.type === 'video' && lesson.file_url && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                              Видео
                            </span>
                          )}
                          {lesson.assignments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {getAssignmentCountText(lesson.assignments.length)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Edit/Delete buttons - show on hover for teachers */}
                  {isTeacher && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditLessonModal(lesson)
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-[#EA5616] transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmLesson(lesson)
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Уроки пока не добавлены</p>
            </div>
          )}

          {/* Add lesson button */}
          {isTeacher && (
            <button
              onClick={openNewLessonModal}
              className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#EA5616] hover:text-[#EA5616] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить урок
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {selectedLesson ? (
          <div className="p-6 lg:p-10">
            {/* Lesson Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#222222]">
                  {selectedLesson.title}
                </h1>
                {selectedLesson.content && (
                  <p className="text-base lg:text-lg text-gray-600 mt-2">
                    {selectedLesson.content}
                  </p>
                )}
              </div>
              {isTeacher && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEditLessonModal(selectedLesson)}
                    className="flex items-center gap-2 px-4 py-2 text-[#EA5616] border border-[#EA5616] rounded-lg hover:bg-[#EA5616]/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </button>
                  <button
                    onClick={() => setDeleteConfirmLesson(selectedLesson)}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить
                  </button>
                </div>
              )}
            </div>

            {/* Video Section */}
            {selectedLesson.type === 'video' && selectedLesson.file_url && courseId && (
              <section className="mb-10">
                <h2 className="text-xl lg:text-2xl font-bold text-[#222222] mb-4">
                  Видео урока
                </h2>
                <div className="bg-[#222222] rounded-2xl overflow-hidden">
                  <video
                    key={selectedLesson.id}
                    controls
                    className="w-full aspect-video"
                    src={getVideoStreamUrl(parseInt(courseId), selectedLesson.id)}
                  >
                    Ваш браузер не поддерживает видео
                  </video>
                </div>
              </section>
            )}

            {/* Text content for non-video lessons */}
            {selectedLesson.type === 'text' && selectedLesson.content && (
              <section className="mb-10 bg-white rounded-2xl p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-bold text-[#222222] mb-4">
                  Материал урока
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {selectedLesson.content}
                </div>
              </section>
            )}

            {/* File download for file lessons */}
            {selectedLesson.type === 'file' && selectedLesson.file_url && (
              <section className="mb-10 bg-white rounded-2xl p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-bold text-[#222222] mb-4">
                  Материалы урока
                </h2>
                <a
                  href={`/api/v1/files/lessons/${courseId}/${selectedLesson.id}`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C2D84] text-white rounded-lg hover:bg-[#2C2D84]/90 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать файл
                </a>
              </section>
            )}

            {/* Assignments Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-[#222222]">
                  Задания к уроку
                </h2>
                {isTeacher && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] text-white rounded-lg hover:bg-[#333333] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить задание
                  </button>
                )}
              </div>

              {selectedLesson.assignments.length > 0 ? (
                <div className="space-y-4">
                  {selectedLesson.assignments.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-2xl p-5 lg:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Assignment number */}
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#2C2D84]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#2C2D84] font-bold text-lg">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base lg:text-lg font-semibold text-[#222222]">
                            {assignment.title}
                          </h3>
                          {assignment.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {assignment.description}
                            </p>
                          )}

                          {/* Assignment metadata */}
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs lg:text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Макс. балл: {assignment.max_score}
                            </span>
                            {assignment.deadline && (
                              <span className="flex items-center gap-1 text-[#EA5616]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Срок: {formatDeadline(assignment.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow icon */}
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Задания пока не добавлены</p>
                  {isTeacher && (
                    <button className="mt-4 px-4 py-2 bg-[#EA5616] text-white rounded-lg hover:bg-[#d14a10] transition-colors">
                      Добавить первое задание
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg">Выберите урок из структуры курса</p>
              {isTeacher && lessons.length === 0 && (
                <button
                  onClick={openNewLessonModal}
                  className="mt-4 px-6 py-3 bg-[#EA5616] text-white rounded-lg hover:bg-[#d14a10] transition-colors"
                >
                  Создать первый урок
                </button>
              )}
            </div>
          </div>
        )}
      </main>

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

      {/* Delete Confirmation Modal */}
      {deleteConfirmLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirmLesson(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-bold text-[#222222] mb-4">
              Удалить урок?
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить урок "{deleteConfirmLesson.title}"? Это действие нельзя отменить.
              {deleteConfirmLesson.assignments.length > 0 && (
                <span className="block mt-2 text-red-500">
                  Все {deleteConfirmLesson.assignments.length} заданий также будут удалены.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmLesson(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteLesson}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
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
