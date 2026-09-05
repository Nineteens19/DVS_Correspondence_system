import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { AppShell } from './components/layout'
import { Toast } from './components/ui'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DocumentListPage from './pages/DocumentListPage'
import DocumentDetailPage from './pages/DocumentDetailPage'
import TaskInboxPage from './pages/TaskInboxPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import ReportsPage from './pages/ReportsPage'
import { authApi } from './services/api'
import type { Screen } from './types'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

function DocumentDetailWrapper({ onNavigate, showToast }: { onNavigate: any, showToast: any }) {
  const { docId } = useParams<{ docId: string }>()
  return <DocumentDetailPage docId={docId || '1'} onNavigate={onNavigate} showToast={showToast} />
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('dvs_token')
  })
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('dvs_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [toast, setToast] = useState<ToastState | null>(null)
  
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('dvs_token')
    if (token && !currentUser) {
      authApi.getMe().then(user => {
        setCurrentUser(user)
        localStorage.setItem('dvs_user', JSON.stringify(user))
      }).catch(() => {
        handleLogout()
      })
    }
  }, [])

  // Derive current screen for AppShell
  let screen = location.pathname.substring(1)
  if (screen === '') screen = 'dashboard'
  if (screen.startsWith('document-detail')) screen = 'document-detail'
  if (screen.startsWith('document-list/incoming')) screen = 'document-list-incoming'
  if (screen.startsWith('document-list/outgoing')) screen = 'document-list-outgoing'

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  const navigateTo = (s: Screen, docId?: string) => {
    if (s === 'document-detail' && docId) {
      navigate(`/document-detail/${docId}`)
    } else if (s === 'document-list-incoming') {
      navigate(`/document-list/incoming`)
    } else if (s === 'document-list-outgoing') {
      navigate(`/document-list/outgoing`)
    } else if (s === 'dashboard') {
      navigate(`/`)
    } else {
      navigate(`/${s}`)
    }
  }

  const handleLoginSuccess = (user?: any) => {
    setIsLoggedIn(true)
    if (user) setCurrentUser(user)
    navigate('/')
  }

  const handleLogout = () => {
    authApi.logout()
    setIsLoggedIn(false)
    setCurrentUser(null)
    navigate('/')
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSuccess} />
  }

  return (
    <>
      <AppShell currentScreen={screen as Screen} onNavigate={navigateTo} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage onNavigate={navigateTo} />} />
          <Route path="/document-list/incoming" element={<DocumentListPage direction="incoming" onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/document-list/outgoing" element={<DocumentListPage direction="outgoing" onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/document-detail/:docId" element={<DocumentDetailWrapper onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/task-inbox" element={<TaskInboxPage onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/register-incoming" element={<RegisterPage docDirection="incoming" onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/register-outgoing" element={<RegisterPage docDirection="outgoing" onNavigate={navigateTo} showToast={showToast} />} />
          <Route path="/admin" element={<AdminPage showToast={showToast} />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<DashboardPage onNavigate={navigateTo} />} />
        </Routes>
      </AppShell>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
