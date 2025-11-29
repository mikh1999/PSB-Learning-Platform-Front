const API_BASE = '/api/v1'

export interface Lesson {
  id: number
  course_id: number
  title: string
  content: string | null
  order: number
  type: 'text' | 'video' | 'file'
  file_url: string | null
  created_at: string
}

export interface LessonCreate {
  title: string
  content?: string
  order?: number
  type?: 'text' | 'video' | 'file'
  file_url?: string
}

export interface LessonUpdate {
  title?: string
  content?: string
  order?: number
  type?: 'text' | 'video' | 'file'
  file_url?: string
}

export interface PaginatedLessons {
  items: Lesson[]
  total: number
  skip: number
  limit: number
}

// Get all lessons for a course
export async function getCourseLessons(
  token: string,
  courseId: number,
  skip = 0,
  limit = 100
): Promise<PaginatedLessons> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString()
  })

  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка загрузки уроков')
  }

  return response.json()
}

// Get a single lesson
export async function getLesson(
  token: string,
  courseId: number,
  lessonId: number
): Promise<Lesson> {
  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка загрузки урока')
  }

  return response.json()
}

// Create a new lesson
export async function createLesson(
  token: string,
  courseId: number,
  lesson: LessonCreate
): Promise<Lesson> {
  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lesson)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка создания урока' }))
    throw new Error(error.detail || 'Ошибка создания урока')
  }

  return response.json()
}

// Update a lesson
export async function updateLesson(
  token: string,
  courseId: number,
  lessonId: number,
  lesson: LessonUpdate
): Promise<Lesson> {
  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lesson)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления урока' }))
    throw new Error(error.detail || 'Ошибка обновления урока')
  }

  return response.json()
}

// Delete a lesson
export async function deleteLesson(
  token: string,
  courseId: number,
  lessonId: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка удаления урока')
  }
}

// Reorder lessons
export async function reorderLessons(
  token: string,
  courseId: number,
  lessonIds: number[]
): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lesson_ids: lessonIds })
  })

  if (!response.ok) {
    throw new Error('Ошибка изменения порядка уроков')
  }

  return response.json()
}

// Get video streaming URL
export function getVideoStreamUrl(courseId: number, lessonId: number): string {
  return `${API_BASE}/files/stream/lessons/${courseId}/${lessonId}`
}

// Upload file to lesson
export async function uploadLessonFile(
  token: string,
  courseId: number,
  lessonId: number,
  file: File
): Promise<{ message: string; file_path: string; download_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/files/lessons/${courseId}/${lessonId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка загрузки файла' }))
    throw new Error(error.detail || 'Ошибка загрузки файла')
  }

  return response.json()
}
