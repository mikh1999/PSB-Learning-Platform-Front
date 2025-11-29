import { useState, useEffect } from 'react'
import { LoginModal } from './LoginModal'
import { RegisterModal } from './RegisterModal'
import { type AuthResponse } from '../api/auth'
import { getFeaturedCourses, type Course } from '../api/courses'

type ModalType = 'login' | 'register' | null

// Course thumbnail images from Figma
const COURSE_IMAGES = ['/course-1.png', '/course-2.png', '/course-3.png']

interface LandingPageProps {
  onAuthSuccess: (auth: AuthResponse) => void
}

export function LandingPage({ onAuthSuccess }: LandingPageProps) {
  const [modal, setModal] = useState<ModalType>(null)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    getFeaturedCourses()
      .then(setCourses)
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header - Figma: logo 219x156, nav 24px/500, gap 37px, buttons 74px height */}
      <header className="px-[28px] lg:px-[42px] 2xl:px-[56px]">
        <div className="flex items-center justify-between h-[120px] lg:h-[140px] 2xl:h-[156px]">
          {/* Logo - Figma: 219x156 */}
          <a href="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="ПСБ"
              className="h-[100px] lg:h-[120px] 2xl:h-[156px] w-auto"
            />
          </a>

          {/* Navigation - Figma: 24px Medium, gap 37px */}
          <nav className="hidden md:flex items-center gap-[20px] lg:gap-[28px] 2xl:gap-[37px]">
            <a
              href="#courses"
              className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity"
            >
              Выбрать курс
            </a>
            <a
              href="#about"
              className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity"
            >
              О нас
            </a>
            <a
              href="#support"
              className="text-[#222222] text-[16px] lg:text-[20px] 2xl:text-[24px] font-medium hover:opacity-70 transition-opacity"
            >
              Поддержка
            </a>
          </nav>

          {/* Auth Buttons - Figma: gap 20px, height 74px, radius 8px */}
          <div className="flex items-center gap-[12px] lg:gap-[16px] 2xl:gap-[20px]">
            {/* Создать аккаунт - Figma: 285x74, outline */}
            <button
              onClick={() => setModal('register')}
              className="h-[48px] lg:h-[58px] 2xl:h-[74px] px-[20px] lg:px-[30px] 2xl:px-[40px] border border-[#222222] rounded-lg text-[#222222] text-[14px] lg:text-[18px] 2xl:text-[24px] font-medium hover:bg-[#222222] hover:text-white transition-colors"
            >
              Создать аккаунт
            </button>
            {/* Войти - Figma: 132x74, filled #222222 */}
            <button
              onClick={() => setModal('login')}
              className="h-[48px] lg:h-[58px] 2xl:h-[74px] px-[24px] lg:px-[32px] 2xl:px-[40px] bg-[#222222] rounded-lg text-white text-[14px] lg:text-[18px] 2xl:text-[24px] font-medium hover:bg-[#333333] transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Figma: title 60px/700, subtitle 38px/400, CTA 253x74, circle 714x714 */}
      <section className="px-[28px] lg:px-[42px] 2xl:px-[56px] py-[50px] lg:py-[75px] 2xl:py-[100px]">
        <div className="flex items-center justify-between">
          {/* Left: Text content - Figma: gap 56px between elements */}
          <div className="flex flex-col gap-[28px] lg:gap-[42px] 2xl:gap-[56px] max-w-[50%]">
            {/* Title - Figma: 60px Bold */}
            <h1 className="text-[32px] lg:text-[46px] 2xl:text-[60px] font-bold text-[#222222] leading-[1.2]">
              Обучайся продуктивно<br />и с комфортом!
            </h1>

            {/* Subtitle - Figma: 38px Regular */}
            <p className="text-[18px] lg:text-[28px] 2xl:text-[38px] font-normal text-[#222222] leading-[1.4]">
              Получай ценные знания в удобном формате от профессиональных преподавателей!
            </p>

            {/* CTA Button - Figma: 253x74, bg #EA5616, radius 8px, 24px */}
            <button className="w-fit h-[48px] lg:h-[58px] 2xl:h-[74px] px-[24px] lg:px-[36px] 2xl:px-[48px] bg-[#EA5616] rounded-lg text-white text-[14px] lg:text-[18px] 2xl:text-[24px] font-medium hover:bg-[#d14a10] transition-colors">
              Выбрать курс
            </button>
          </div>

          {/* Right: Hero Image with Circle - Figma: circle 714x714, image 898x812, image bottom 98px below circle */}
          <div className="relative flex items-end justify-center flex-1 min-h-[350px] lg:min-h-[550px] 2xl:min-h-[812px]">
            {/* Circle - Figma: 714x714, positioned so image extends below */}
            <div className="absolute top-0 w-[280px] lg:w-[450px] 2xl:w-[714px] h-[280px] lg:h-[450px] 2xl:h-[714px] bg-[#B4C5CC] rounded-full" />
            {/* Hero Image - Figma: 898x812, larger than circle, bottom extends below */}
            <img
              src="/hero-image.png"
              alt="Обучение"
              className="w-[350px] lg:w-[560px] 2xl:w-[898px] h-auto object-contain relative z-10"
            />
          </div>
        </div>
      </section>

      {/* Courses Section - Figma: title 60px, cards 589x659, gap 21px */}
      <section id="courses" className="px-[28px] lg:px-[42px] 2xl:px-[56px] py-[50px] lg:py-[75px] 2xl:py-[100px]">
        {/* Section Title - Figma: 60px Bold, gap 56px to cards */}
        <h2 className="text-[32px] lg:text-[46px] 2xl:text-[60px] font-bold text-[#222222] mb-[28px] lg:mb-[42px] 2xl:mb-[56px]">
          Выбрать курс
        </h2>

        {/* Course Cards Grid - Figma: 3 columns, gap 21px, card 589x659 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px] lg:gap-[18px] 2xl:gap-[21px]">
          {courses.length > 0 ? (
            courses.map((course, index) => (
              <div
                key={course.id}
                className="rounded-2xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                {/* Card Image - Figma: 589x322, use index to ensure unique images */}
                <div className="h-[180px] lg:h-[250px] 2xl:h-[322px] overflow-hidden rounded-t-2xl">
                  <img
                    src={COURSE_IMAGES[index % COURSE_IMAGES.length]}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Content - Figma: bg #FFFFFF, gap 57px between sections */}
                <div className="bg-white p-[16px] lg:p-[24px] 2xl:p-[32px]">
                  {/* Tags - Figma: 12px Medium, bg #2C2D84, radius 8px, gap 10px */}
                  <div className="flex flex-wrap gap-[6px] lg:gap-[8px] 2xl:gap-[10px] mb-[24px] lg:mb-[40px] 2xl:mb-[57px]">
                    <span className="px-[10px] lg:px-[14px] 2xl:px-[18px] py-[4px] lg:py-[6px] 2xl:py-[8px] bg-[#2C2D84] text-white text-[10px] lg:text-[11px] 2xl:text-[12px] font-medium rounded-lg">
                      #нейросети
                    </span>
                    <span className="px-[10px] lg:px-[14px] 2xl:px-[18px] py-[4px] lg:py-[6px] 2xl:py-[8px] bg-[#2C2D84] text-white text-[10px] lg:text-[11px] 2xl:text-[12px] font-medium rounded-lg">
                      #для начинающих
                    </span>
                  </div>

                  {/* Course Title - Figma: 32px Bold */}
                  <h3 className="text-[18px] lg:text-[24px] 2xl:text-[32px] font-bold text-[#222222] leading-[1.3] mb-[24px] lg:mb-[40px] 2xl:mb-[57px]">
                    {course.title}
                  </h3>

                  {/* Duration - Figma: 54px Bold */}
                  <p className="text-[28px] lg:text-[40px] 2xl:text-[54px] font-bold text-[#222222]">
                    1 месяц
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-500 text-xl">
              Загрузка курсов...
            </div>
          )}
        </div>
      </section>

      {/* About Section - Figma: title 60px, text 38px/400 */}
      <section id="about" className="px-[28px] lg:px-[42px] 2xl:px-[56px] py-[50px] lg:py-[75px] 2xl:py-[100px]">
        {/* Section Title - Figma: 60px Bold */}
        <h2 className="text-[32px] lg:text-[46px] 2xl:text-[60px] font-bold text-[#222222] mb-[28px] lg:mb-[42px] 2xl:mb-[56px]">
          О нас
        </h2>

        {/* About Text - Figma: 38px Regular */}
        <div className="space-y-[24px] lg:space-y-[36px] 2xl:space-y-[48px]">
          <p className="text-[16px] lg:text-[26px] 2xl:text-[38px] font-normal text-[#222222] leading-[1.5]">
            ПАО «Промсвязьбанк», являясь одной из ведущих финансовых организаций России, видит своей стратегической задачей развитие человеческого потенциала. Мы уверены, что успех компании напрямую зависит от профессионализма, компетенций и вовлеченности наших сотрудников.
          </p>
          <p className="text-[16px] lg:text-[26px] 2xl:text-[38px] font-normal text-[#222222] leading-[1.5]">
            Корпоративные курсы ПСБ — это целостная экосистема непрерывного обучения, разработанная для формирования кадрового резерва, адаптации сотрудников к быстро меняющимся рыночным условиям и внедрения единых стандартов качества обслуживания.
          </p>
        </div>
      </section>

      {/* Footer - Figma: bg #222222, padding 110px/56px, text 32px/500 #F8F8F8 */}
      <footer className="bg-[#222222] px-[28px] lg:px-[42px] 2xl:px-[56px] py-[55px] lg:py-[82px] 2xl:py-[110px]">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-[40px] lg:gap-[100px]">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/logo.png"
              alt="ПСБ"
              className="h-[120px] lg:h-[200px] 2xl:h-[311px] w-auto brightness-0 invert"
            />
          </div>

          {/* Footer Links - Figma: 3 columns, gap 100px horizontal, 50px vertical */}
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

      {/* Modals */}
      <LoginModal
        isOpen={modal === 'login'}
        onClose={() => setModal(null)}
        onSuccess={onAuthSuccess}
        onSwitchToRegister={() => setModal('register')}
      />

      <RegisterModal
        isOpen={modal === 'register'}
        onClose={() => setModal(null)}
        onSuccess={onAuthSuccess}
        onSwitchToLogin={() => setModal('login')}
      />
    </div>
  )
}
