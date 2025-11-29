import { API_BASE } from './config'

export interface PendingSubmission {
  submission_id: number
  student_id: number
  student_name: string
  student_email: string
  assignment_id: number
  assignment_title: string
  max_score: number
  lesson_id: number
  lesson_title: string
  course_id: number
  course_title: string
  content: string | null
  file_url: string | null
  submitted_at: string | null
  status: string
}

export interface PendingSubmissionsResponse {
  items: PendingSubmission[]
  total: number
}

export interface GradeCreate {
  score: number
  feedback?: string
}

export type SubmissionStatusFilter = 'submitted' | 'graded' | 'returned' | 'all'

// Get all pending submissions for teacher
export async function getPendingSubmissions(
  token: string,
  statusFilter?: SubmissionStatusFilter
): Promise<PendingSubmissionsResponse> {
  const params = new URLSearchParams()
  if (statusFilter) {
    params.set('status_filter', statusFilter)
  }

  const url = `${API_BASE}/gradebook/pending${params.toString() ? '?' + params.toString() : ''}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка загрузки заданий' }))
    throw new Error(error.detail || 'Ошибка загрузки заданий')
  }

  return response.json()
}

// Grade a submission
export async function gradeSubmission(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  submissionId: number,
  grade: GradeCreate
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}/submissions/${submissionId}/grade/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(grade)
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка выставления оценки' }))
    throw new Error(error.detail || 'Ошибка выставления оценки')
  }
}

// Get file download URL for submission
export function getSubmissionFileUrl(submissionId: number, token?: string): string {
  const baseUrl = `${API_BASE}/files/submissions/${submissionId}`
  if (token) {
    return `${baseUrl}?token=${encodeURIComponent(token)}`
  }
  return baseUrl
}

// Return submission for revision (teacher only)
export async function returnSubmission(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  submissionId: number,
  feedback?: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}/submissions/${submissionId}/return`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feedback })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка возврата работы' }))
    throw new Error(error.detail || 'Ошибка возврата работы')
  }
}

// Comment on a submission
export interface SubmissionComment {
  id: number
  submission_id: number
  user_id: number
  user_name: string
  content: string
  created_at: string
}

// Get comments on a submission
export async function getSubmissionComments(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  submissionId: number
): Promise<SubmissionComment[]> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка загрузки комментариев' }))
    throw new Error(error.detail || 'Ошибка загрузки комментариев')
  }

  return response.json()
}

// Add comment to a submission
export async function addSubmissionComment(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  submissionId: number,
  content: string
): Promise<SubmissionComment> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка добавления комментария' }))
    throw new Error(error.detail || 'Ошибка добавления комментария')
  }

  return response.json()
}

// Update a grade
export async function updateGrade(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  submissionId: number,
  grade: GradeCreate
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}/submissions/${submissionId}/grade/`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(grade)
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления оценки' }))
    throw new Error(error.detail || 'Ошибка обновления оценки')
  }
}
