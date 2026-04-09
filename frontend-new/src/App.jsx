import React, { useEffect, useState } from 'react'
import { useStore, authFetch } from './store'
import { ToastProvider } from './components/Toast'
import AuthOverlay from './components/AuthOverlay'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './views/Dashboard'
import UploadWizard from './views/UploadWizard'
import Reports from './views/Reports'
import Projects from './views/Projects'
import Settings from './views/Settings'

export default function App() {
  const { token, setUser, user, logout } = useStore()
  const [view, setView] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!token) { setAuthChecked(true); return }
    authFetch('/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => { setUser(u); setAuthChecked(true) })
      .catch(() => { logout(); setAuthChecked(true) })
  }, [token])

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#1f2a36] border-t-accent rounded-full animate-spin" />
    </div>
  )

  return (
    <ToastProvider>
      {!token && <AuthOverlay />}
      <div className={`flex min-h-screen transition-all ${!token ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <Sidebar view={view} setView={setView} />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar user={user} onLogout={logout} />
          <main className="flex-1 overflow-y-auto p-6">
            {view === 'dashboard' && <Dashboard setView={setView} />}
            {view === 'tool'      && <UploadWizard />}
            {view === 'reports'   && <Reports />}
            {view === 'projects'  && <Projects />}
            {view === 'settings'  && <Settings />}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
