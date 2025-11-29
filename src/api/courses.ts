const API_BASE = '/api/v1'

// Generic paginated response from backend
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface Course {
  id: number
  title: string
  description: string
  teacher_id?: number
  status?: 'draft' | 'published'
}

export interface Enrollment {
  id: number
  student_id: number
  course_id: number
  progress: number
  enrolled_at: string
  course_title: string
}

// /my/courses returns different structures for students vs teachers
export type MyCoursesResponse = Enrollment | Course

export interface CourseProgress {
  total: number
  completed: number
  percentage: number
}

// Public: Featured courses for landing page
export async function getFeaturedCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE}/courses/featured`)

  if (!response.ok) {
    throw new Error('Ошибка загрузки курсов')
  }

  return response.json()
}

// Pagination params
export interface PaginationParams {
  skip?: number
  limit?: number
}

// Auth required: Get user's enrolled courses
// Returns Enrollment[] for students, Course[] for teachers
export async function getMyCourses(
  token: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<MyCoursesResponse>> {
  const { skip = 0, limit = 6 } = params
  const queryParams = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString()
  })

  const response = await fetch(`${API_BASE}/my/courses?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка загрузки ваших курсов')
  }

  return response.json()
}

// Auth required: Get progress for a specific course
export async function getCourseProgress(token: string, courseId: number): Promise<CourseProgress> {
  const response = await fetch(`${API_BASE}/progress/courses/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка загрузки прогресса')
  }

  return response.json()
}

// Auth required: Get course details
export async function getCourse(token: string, courseId: number): Promise<Course> {
  const response = await fetch(`${API_BASE}/courses/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Ошибка загрузки курса')
  }

  return response.json()
}

// Auth required: Create a new course (teachers only)
export interface CourseCreate {
  title: string
  description?: string
  status?: 'draft' | 'published'
}

export async function createCourse(token: string, course: CourseCreate): Promise<Course> {
  const response = await fetch(`${API_BASE}/courses/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(course)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка создания курса' }))
    throw new Error(error.detail || 'Ошибка создания курса')
  }

  return response.json()
}
