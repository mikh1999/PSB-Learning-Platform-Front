import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { type User } from '../api/auth'
import { getMyCourses, type Enrollment, type Course } from '../api/courses'
import { getPendingSubmissions } from '../api/submissions'
import { CreateCourseModal } from './CreateCourseModal'

// Course thumbnail images from Figma
const COURSE_IMAGES = ['/course-1.png', '/course-2.png', '/course-3.png']

function getCourseImage(courseId: number): string {
  return COURSE_IMAGES[courseId % COURSE_IMAGES.length]
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

interface UserCourse {
  id: number
  title: string
  description: string
  progress: number | null  // null for teachers
  status?: 'draft' | 'published'  // for teachers
}

// Figma layer "3729" - Personal cabinet for authenticated users
export function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userCourses, setUserCourses] = useState<UserCourse[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(6)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Check if user is a teacher
  const isTeacher = user.role === 'teacher'

  // Fetch pending submissions count for teachers
  useEffect(() => {
    if (!isTeacher) return
    const token = localStorage.getItem('access_token')
    if (!token) return

    getPendingSubmissions(token, 'submitted')
      .then(data => setPendingCount(data.total))
      .catch(() => setPendingCount(0))
  }, [isTeacher])

  // Fetch user's enrolled courses with server-side pagination
  const fetchCourses = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    setLoading(true)
    try {
      const skip = (currentPage - 1) * perPage
      const response = await getMyCourses(token, { skip, limit: perPage })

      // API returns different structures for students vs teachers
      // Students get Enrollment (course_id, course_title, progress)
      // Teachers get Course (id, title, description)
      const courses = response.items.map((item) => {
        // Check if it's an enrollment (has course_id) or a course (has teacher_id)
        if ('course_id' in item) {
          // Student enrollment
          const enrollment = item as Enrollment
          return {
            id: enrollment.course_id,
            title: enrollment.course_title,
            description: '',
            progress: enrollment.progress
          }
        } else {
          // Teacher course
          const course = item as Course
          return {
            id: course.id,
            title: course.title,
            description: course.description || '',
            progress: null, // Teachers don't have progress
            status: course.status || 'draft'
          }
        }
      })

      setUserCourses(courses)
      setTotalCourses(response.total)
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Refresh courses when navigating back to dashboard
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      fetchCourses()
    }
  }, [location.pathname, fetchCourses])

  // Handle new course creation - refresh from server to get correct pagination
  const handleCourseCreated = (_course: Course) => {
    // Go to first page and refresh to show the new course
    if (currentPage === 1) {
      fetchCourses()
    } else {
      setCurrentPage(1) // This will trigger fetchCourses via useEffect
    }
  }

  // Open course page in same tab
  const handleOpenCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`)
  }

  // Mock achievements from Figma - 147x147 circles, 58px bold icons
  const achievements = [
    { id: 1, icon: 'JS', color: '#222222' },
    { id: 2, icon: '@', color: '#EA5616' },
    { id: 3, icon: 'С#', color: '#2C2D84' },
    { id: 4, icon: '5+', color: '#222222' },
  ]

  // Pagination - calculated from server total
  const totalPages = Math.ceil(totalCourses / perPage)

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header - same as main page */}
      <header className="px-[28px] lg:px-[42px] 2xl:px-[56px]">
        <div className="flex items-center justify-between h-[120px] lg:h-[140px] 2xl:h-[156px]">
          {/* Logo - Figma: 219x156 */}
          <a href="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="ПСБ" className="h-[100px] lg:h-[120px] 2xl:h-[156px] w-auto" />
          </a>

          {/* Navigation - Figma: 24px Medium, gap 37px */}
          <nav className="hidden md:flex items-center gap-[20px] lg:gap-[28px] 2xl:gap-[37px]">
            <a href="#courses" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              Выбрать курс
            </a>
            <a href="#about" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              О нас
            </a>
            <a href="#support" className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity">
              Поддержка
            </a>
          </nav>

          {/* Logout Button - Figma: 170x74, #222222, radius 8px */}
          <button
            onClick={onLogout}
            className="h-[48px] lg:h-[58px] 2xl:h-[74px] px-[24px] lg:px-[32px] 2xl:px-[40px] bg-[#222222] rounded-lg text-white text-[14px] lg:text-[18px] 2xl:text-[24px] font-medium hover:bg-[#333333] transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="px-[28px] lg:px-[42px] 2xl:px-[56px] py-[50px] lg:py-[75px] 2xl:py-[100px]">
        {/* Page Title - Figma: 46px Bold */}
        <h1 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-[46px] font-bold text-[#222222] mb-8 lg:mb-12">
          Личный кабинет
        </h1>

        {/* Profile & Achievements Row - Figma exact specs */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16 2xl:gap-24 mb-12 lg:mb-16">
          {/* User Profile - Figma: Avatar 194x194, Name 31px Bold, Role 21px Medium */}
          <div className="flex items-center gap-5 lg:gap-6 2xl:gap-8">
            {/* Avatar - Figma: 194x194 circle with image and camera icon */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 lg:w-28 lg:h-28 xl:w-36 xl:h-36 2xl:w-[194px] 2xl:h-[194px] rounded-full overflow-hidden">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Camera icon - Figma: 53x53, dark bg #222222, white icon */}
              <button
                onClick={() => window.open('/profile/edit', '_blank')}
                className="absolute bottom-0 right-0 w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 2xl:w-[53px] 2xl:h-[53px] bg-[#222222] hover:bg-[#333333] rounded-full flex items-center justify-center shadow-lg transition-colors"
                title="Изменить фото"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col justify-center">
              {/* Name with edit icon - aligned on same baseline */}
              <div className="flex items-center gap-3 lg:gap-4">
                <span className="text-xl lg:text-2xl xl:text-[28px] 2xl:text-[31px] font-bold text-[#222222]">
                  {user.first_name} {user.last_name}
                </span>
                <button
                  onClick={() => window.open('/profile/edit', '_blank')}
                  className="hover:opacity-70 transition-opacity"
                  title="Редактировать профиль"
                >
                  <img src="/pencil-icon.png" alt="Редактировать" className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9" />
                </button>
              </div>
              {/* Role/Position - Figma: 21px Medium */}
              <p className="text-sm lg:text-base xl:text-lg 2xl:text-[21px] font-medium text-[#222222] mt-1">
                {user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
              </p>
              {/* Check Assignments Button - under name and role, only for teachers */}
              {isTeacher && (
                <div className="relative inline-block mt-3 lg:mt-4">
                  <button
                    onClick={() => navigate('/assignments')}
                    className="h-[40px] lg:h-[46px] xl:h-[50px] 2xl:h-[56px] px-5 lg:px-6 xl:px-8 2xl:px-10 bg-[#2C2D84] hover:bg-[#3d3e95] rounded-lg text-white text-[14px] lg:text-[16px] xl:text-[18px] 2xl:text-[20px] font-bold transition-colors font-['Montserrat']"
                  >
                    Проверить задания
                  </button>
                  {/* Notification badge - show only if there are pending submissions */}
                  {pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 lg:-top-2 lg:-right-2 min-w-6 h-6 lg:min-w-7 lg:h-7 2xl:min-w-8 2xl:h-8 px-1.5 bg-[#EA5616] rounded-full flex items-center justify-center text-white text-[14px] lg:text-[16px] xl:text-[18px] 2xl:text-[20px] font-semibold font-['Montserrat']">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="flex items-center gap-4 lg:gap-6 2xl:gap-8">
            {/* Achievement Circles - smaller */}
            <div className="flex">
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="w-12 h-12 lg:w-14 lg:h-14 xl:w-18 xl:h-18 2xl:w-[90px] 2xl:h-[90px] rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: achievement.color,
                    marginLeft: index === 0 ? 0 : '-28px',
                    zIndex: achievements.length - index
                  }}
                >
                  {/* Icon */}
                  <span className="text-white text-sm lg:text-lg xl:text-2xl 2xl:text-[36px] font-bold">
                    {achievement.icon}
                  </span>
                </div>
              ))}
            </div>
            {/* Title */}
            <h3 className="text-base lg:text-lg xl:text-xl 2xl:text-[24px] font-bold text-[#222222] leading-tight">
              Ваши<br />достижения
            </h3>
          </div>
        </div>

        {/* User Courses Section */}
        <section>
          {/* Section Header - Figma: 46px Bold */}
          <div className="flex items-baseline gap-3 lg:gap-4 mb-8 lg:mb-10">
            <span className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-[46px] font-bold text-[#222222] leading-none">
              Ваши курсы
            </span>
            {/* Add Button - aligned on same baseline */}
            {isTeacher && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-baseline gap-1.5 text-sm lg:text-base xl:text-lg 2xl:text-[27px] font-semibold text-[#222222] opacity-30 hover:opacity-60 transition-opacity leading-none"
              >
                Добавить
                <span className="w-5 h-5 lg:w-6 lg:h-6 2xl:w-7 2xl:h-7 rounded-full border-2 border-current inline-flex items-center justify-center translate-y-[-2px]">
                  <span className="text-xs lg:text-sm 2xl:text-base leading-none">+</span>
                </span>
              </button>
            )}
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#EA5616] border-t-transparent" />
              </div>
            ) : userCourses.length > 0 ? (
              userCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => isTeacher ? handleOpenCourse(course.id) : undefined}
                  className={`bg-[#D9D9D9] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow ${isTeacher ? 'cursor-pointer' : ''}`}
                >
                  {/* Course Image - Figma: 589x322 */}
                  <div className="h-[140px] lg:h-[180px] xl:h-[220px] 2xl:h-[280px] rounded-t-2xl relative overflow-hidden">
                    <img
                      src={getCourseImage(course.id)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Status badge on image - dark for draft, light for published */}
                    {isTeacher && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium ${
                          course.status === 'published'
                            ? 'bg-white text-[#222222]'
                            : 'bg-[#222222] text-white'
                        }`}>
                          {course.status === 'published' ? 'опубликован' : 'черновик'}
                        </span>
                      </div>
                    )}

                    {/* Progress indicator - only for students */}
                    {course.progress !== null && (
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <div className="bg-white/80 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#EA5616] h-full rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#222222] mt-1 block">{course.progress}% пройдено</span>
                      </div>
                    )}
                  </div>

                  {/* Course Content - Figma: white bg, title + pencil icon */}
                  <div className="bg-white p-4 lg:p-5 2xl:p-6 rounded-b-2xl min-h-[100px] lg:min-h-[120px] 2xl:min-h-[140px] flex flex-col justify-between">
                    {/* Title - Figma style: 2 lines */}
                    <h3 className="text-sm lg:text-base xl:text-lg 2xl:text-xl leading-snug font-medium text-[#222222]">
                      {course.title}
                    </h3>

                    {/* Edit pencil icon - Figma: bottom-right corner, bigger size */}
                    {isTeacher && (
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCourse(course.id)
                          }}
                          className="hover:opacity-70 transition-opacity"
                          title="Редактировать курс"
                        >
                          <img src="/pencil-icon.png" alt="Редактировать" className="w-7 h-7 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg lg:text-xl mb-4">У вас пока нет курсов</p>
                <a
                  href="#courses"
                  className="inline-block px-6 py-3 bg-[#EA5616] text-white rounded-lg font-medium hover:bg-[#d14a10] transition-colors"
                >
                  Выбрать курс
                </a>
              </div>
            )}
          </div>

          {/* Pagination - Figma style */}
          {totalCourses > 0 && (
            <div className="flex items-center justify-center mt-10 lg:mt-14 2xl:mt-16 gap-[14px] font-['Montserrat']">
              {/* Previous page arrow - Figma: stroke 4px, round cap */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-30 hover:opacity-70 transition-opacity"
              >
                <svg width="10" height="19" viewBox="0 0 10 19" fill="none" className="w-[8px] h-[16px] lg:w-[9px] lg:h-[18px] 2xl:w-[10px] 2xl:h-[19px]">
                  <path d="M9 1L1 9.5L9 18" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Page numbers - Figma: "1 2 3 4 5 ...29" format, 32px SemiBold */}
              <div className="flex items-center gap-[14px] text-[20px] lg:text-[26px] 2xl:text-[32px] font-semibold text-black">
                {(() => {
                  const pages: (number | string)[] = []
                  const maxVisible = 5

                  if (totalPages <= maxVisible + 2) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Always show first 5 pages
                    for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
                      pages.push(i)
                    }
                    // Add ellipsis and last page
                    if (totalPages > maxVisible) {
                      pages.push(`...${totalPages}`)
                    }
                  }

                  return pages.map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(page)}
                        className={`transition-opacity hover:opacity-70 ${
                          page === currentPage ? 'opacity-100' : 'opacity-50'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(totalPages)}
                        className="opacity-50 hover:opacity-70 transition-opacity"
                      >
                        {page}
                      </button>
                    )
                  ))
                })()}
              </div>

              {/* Next page arrow - Figma: stroke 4px, round cap */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="disabled:opacity-30 hover:opacity-70 transition-opacity"
              >
                <svg width="10" height="19" viewBox="0 0 10 19" fill="none" className="w-[8px] h-[16px] lg:w-[9px] lg:h-[18px] 2xl:w-[10px] 2xl:h-[19px]">
                  <path d="M1 1L9 9.5L1 18" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer - Same as main page */}
      <footer className="bg-[#222222] px-[28px] lg:px-[42px] 2xl:px-[56px] py-[55px] lg:py-[82px] 2xl:py-[110px] mt-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-[40px] lg:gap-[100px]">
          {/* Logo - Figma: white-orange logo */}
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
              <a href="#about" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                О нас
              </a>
              <a href="#support" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
                Поддержка
              </a>
              <a href="#courses" className="text-[#F8F8F8] text-[18px] lg:text-[24px] 2xl:text-[32px] font-medium hover:opacity-70 transition-opacity">
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

      {/* Create Course Modal - only for teachers */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCourseCreated}
      />
    </div>
  )
}
