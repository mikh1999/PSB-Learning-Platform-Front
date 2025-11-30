import { API_BASE } from './config'
import { handleUnauthorized } from './apiClient'

// Helper to check response and handle 401
function checkResponse(response: Response): Response {
  if (response.status === 401) {
    handleUnauthorized()
  }
  return response
}

export interface Assignment {
  id: number
  lesson_id: number
  title: string
  description: string | null
  deadline: string | null
  max_score: number
  created_at: string
}

export interface AssignmentCreate {
  title: string
  description?: string
  deadline?: string
  max_score?: number
}

export interface AssignmentUpdate {
  title?: string
  description?: string
  deadline?: string
  max_score?: number
}

export interface PaginatedAssignments {
  items: Assignment[]
  total: number
  skip: number
  limit: number
}

// Get all assignments for a lesson
export async function getLessonAssignments(
  token: string,
  courseId: number,
  lessonId: number,
  skip = 0,
  limit = 100
): Promise<PaginatedAssignments> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString()
  })

  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Ошибка загрузки заданий')
  }

  return response.json()
}

// Get a single assignment
export async function getAssignment(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number
): Promise<Assignment> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Ошибка загрузки задания')
  }

  return response.json()
}

// Create a new assignment
export async function createAssignment(
  token: string,
  courseId: number,
  lessonId: number,
  assignment: AssignmentCreate
): Promise<Assignment> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assignment)
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка создания задания' }))
    throw new Error(error.detail || 'Ошибка создания задания')
  }

  return response.json()
}

// Update an assignment
export async function updateAssignment(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number,
  assignment: AssignmentUpdate
): Promise<Assignment> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assignment)
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления задания' }))
    throw new Error(error.detail || 'Ошибка обновления задания')
  }

  return response.json()
}

// Delete an assignment
export async function deleteAssignment(
  token: string,
  courseId: number,
  lessonId: number,
  assignmentId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/lessons/${lessonId}/assignments/${assignmentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Ошибка удаления задания')
  }
}
