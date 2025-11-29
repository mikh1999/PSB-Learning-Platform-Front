import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPendingSubmissions,
  gradeSubmission,
  getSubmissionFileUrl,
  returnSubmission,
  getSubmissionComments,
  addSubmissionComment,
  type PendingSubmission,
  type SubmissionStatusFilter,
  type SubmissionComment
} from '../api/submissions'

const STATUS_FILTERS: { value: SubmissionStatusFilter; label: string }[] = [
  { value: 'submitted', label: 'На проверке' },
  { value: 'graded', label: 'Проверенные' },
  { value: 'returned', label: 'На доработке' },
  { value: 'all', label: 'Все' },
]

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  submitted: { text: 'На проверке', color: 'bg-yellow-100 text-yellow-800' },
  graded: { text: 'Проверено', color: 'bg-green-100 text-green-800' },
  returned: { text: 'На доработке', color: 'bg-orange-100 text-orange-800' },
  draft: { text: 'Черновик', color: 'bg-gray-100 text-gray-600' },
}

export function AssignmentsPage() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gradingSubmission, setGradingSubmission] = useState<PendingSubmission | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>('submitted')

  // Return submission state
  const [returningSubmission, setReturningSubmission] = useState<PendingSubmission | null>(null)
  const [returnFeedback, setReturnFeedback] = useState('')
  const [returning, setReturning] = useState(false)

  // Comments state
  const [viewingComments, setViewingComments] = useState<PendingSubmission | null>(null)
  const [comments, setComments] = useState<SubmissionComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [addingComment, setAddingComment] = useState(false)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadSubmissions()
  }, [token, navigate, statusFilter])

  const loadSubmissions = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getPendingSubmissions(token, statusFilter)
      setSubmissions(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingSubmission || !token) return

    setGradeError(null)

    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 0) {
      setGradeError('Введите корректную оценку')
      return
    }

    try {
      setGrading(true)
      await gradeSubmission(
        token,
        gradingSubmission.course_id,
        gradingSubmission.lesson_id,
        gradingSubmission.assignment_id,
        gradingSubmission.submission_id,
        { score: scoreNum, feedback: feedback || undefined }
      )
      setGradingSubmission(null)
      setScore('')
      setFeedback('')
      setGradeError(null)
      loadSubmissions()
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Ошибка выставления оценки')
    } finally {
      setGrading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Return submission for revision
  const handleReturn = async () => {
    if (!returningSubmission || !token) return

    try {
      setReturning(true)
      await returnSubmission(
        token,
        returningSubmission.course_id,
        returningSubmission.lesson_id,
        returningSubmission.assignment_id,
        returningSubmission.submission_id,
        returnFeedback || undefined
      )
      setReturningSubmission(null)
      setReturnFeedback('')
      loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка возврата работы')
    } finally {
      setReturning(false)
    }
  }

  // Load comments for a submission
  const loadComments = async (submission: PendingSubmission) => {
    if (!token) return

    setViewingComments(submission)
    setLoadingComments(true)
    try {
      const data = await getSubmissionComments(
        token,
        submission.course_id,
        submission.lesson_id,
        submission.assignment_id,
        submission.submission_id
      )
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  // Add a new comment
  const handleAddComment = async () => {
    if (!viewingComments || !token || !newComment.trim()) return

    try {
      setAddingComment(true)
      const comment = await addSubmissionComment(
        token,
        viewingComments.course_id,
        viewingComments.lesson_id,
        viewingComments.assignment_id,
        viewingComments.submission_id,
        newComment.trim()
      )
      setComments([...comments, comment])
      setNewComment('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления комментария')
    } finally {
      setAddingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2C2D84] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-[#222222] font-['Montserrat']">
                Проверка заданий
              </h1>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-white text-[#2C2D84] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="bg-[#EA5616] text-white px-4 py-2 rounded-lg font-semibold">
              {submissions.length} {statusFilter === 'submitted' ? 'на проверку' : 'записей'}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-800 hover:underline">
              Закрыть
            </button>
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Нет заданий на проверку</h2>
            <p className="text-gray-400">Все задания проверены!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.submission_id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Course & Lesson info + Status badge */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 flex-wrap">
                      <span className="bg-[#2C2D84]/10 text-[#2C2D84] px-2 py-1 rounded">
                        {submission.course_title}
                      </span>
                      <span>→</span>
                      <span>{submission.lesson_title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_LABELS[submission.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[submission.status]?.text || submission.status}
                      </span>
                    </div>

                    {/* Assignment title */}
                    <h3 className="text-lg font-semibold text-[#222222] mb-2">
                      {submission.assignment_title}
                    </h3>

                    {/* Student info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#EA5616] rounded-full flex items-center justify-center text-white font-semibold">
                        {submission.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#222222]">{submission.student_name}</p>
                        <p className="text-sm text-gray-500">{submission.student_email}</p>
                      </div>
                    </div>

                    {/* Submitted at */}
                    <p className="text-sm text-gray-500 mb-3">
                      Сдано: {formatDate(submission.submitted_at)}
                    </p>

                    {/* Content */}
                    {submission.content && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    )}

                    {/* File */}
                    {submission.file_url && token && (
                      <a
                        href={getSubmissionFileUrl(submission.submission_id, token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#2C2D84] hover:underline"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Скачать файл
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    {/* Grade button - only for non-graded submissions */}
                    {submission.status !== 'graded' && (
                      <button
                        onClick={() => {
                          setGradingSubmission(submission)
                          setScore('')
                          setFeedback('')
                          setGradeError(null)
                        }}
                        className="px-6 py-3 bg-[#2C2D84] text-white rounded-lg font-semibold hover:bg-[#3d3e95] transition-colors"
                      >
                        Оценить
                      </button>
                    )}

                    {/* Return for revision button - only for submitted */}
                    {submission.status === 'submitted' && (
                      <button
                        onClick={() => {
                          setReturningSubmission(submission)
                          setReturnFeedback('')
                        }}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                      >
                        На доработку
                      </button>
                    )}

                    {/* Comments button */}
                    <button
                      onClick={() => loadComments(submission)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Комментарии
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setGradingSubmission(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-[#222222] mb-4">Оценить задание</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{gradingSubmission.assignment_title}</p>
              <p className="text-sm text-gray-500">{gradingSubmission.student_name}</p>
              <p className="text-sm text-[#2C2D84] font-medium mt-1">
                Максимальный балл: {gradingSubmission.max_score}
              </p>
            </div>

            <form onSubmit={handleGrade} className="space-y-4">
              {gradeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {gradeError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Оценка (от 0 до {gradingSubmission.max_score}) *
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min={0}
                  max={gradingSubmission.max_score}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none"
                  placeholder={`Максимум ${gradingSubmission.max_score} баллов`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none resize-none"
                  placeholder="Оставьте комментарий для студента..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={grading || !score}
                  className="flex-1 px-4 py-3 bg-[#2C2D84] text-white rounded-lg font-medium hover:bg-[#3d3e95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {grading ? 'Сохранение...' : 'Сохранить оценку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return for Revision Modal */}
      {returningSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReturningSubmission(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-[#222222] mb-4">Вернуть на доработку</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{returningSubmission.assignment_title}</p>
              <p className="text-sm text-gray-500">{returningSubmission.student_name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-2">
                  Комментарий для студента (необязательно)
                </label>
                <textarea
                  value={returnFeedback}
                  onChange={(e) => setReturnFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  placeholder="Укажите, что нужно исправить..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningSubmission(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleReturn}
                  disabled={returning}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {returning ? 'Отправка...' : 'Вернуть'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {viewingComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewingComments(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#222222]">Комментарии</h2>
              <button
                onClick={() => setViewingComments(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{viewingComments.assignment_title}</p>
              <p className="text-sm text-gray-500">{viewingComments.student_name}</p>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[200px]">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2C2D84] border-t-transparent"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Комментариев пока нет</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[#222222]">{comment.user_name}</span>
                      <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment form */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C2D84] focus:border-transparent outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="px-4 py-2 bg-[#2C2D84] text-white rounded-lg font-medium hover:bg-[#3d3e95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingComment ? '...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
