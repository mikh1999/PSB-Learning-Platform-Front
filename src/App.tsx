import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { LandingPage } from './components/LandingPage'
import { CoursePage } from './pages/CoursePage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { getCurrentUser, type User, type AuthResponse } from './api/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      getCurrentUser(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleAuthSuccess = async (_auth: AuthResponse) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const user = await getCurrentUser(token)
      setUser(user)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EA5616] border-t-transparent" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Course page - accessible to authenticated users */}
      <Route
        path="/courses/:courseId"
        element={
          user ? (
            <CoursePage />
          ) : (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
              <p className="text-xl text-gray-500">Войдите для доступа к курсу</p>
            </div>
          )
        }
      />

      {/* Assignments page - for teachers to review submissions */}
      <Route
        path="/assignments"
        element={
          user ? (
            <AssignmentsPage />
          ) : (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
              <p className="text-xl text-gray-500">Войдите для доступа</p>
            </div>
          )
        }
      />

      {/* Dashboard or Landing page */}
      <Route
        path="*"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LandingPage onAuthSuccess={handleAuthSuccess} />
          )
        }
      />
    </Routes>
  )
}

export default App
