import { useState } from 'react'
import clsx from 'clsx'
import { useTheme } from './hooks/useTheme'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ReadingsPage } from './features/readings/ReadingsPage'
import { IncidentsPage } from './features/incidents/IncidentsPage'
import { ThresholdsPage } from './features/thresholds/ThresholdsPage'
import { SensorsPage } from './features/sensors/SensorsPage'
import { IncidentModal } from './features/incidents/IncidentModal'
import { ThresholdForm } from './features/thresholds/ThresholdForm'
import { LoginPage } from './features/auth/LoginPage'

export default function App() {
  const { dark, toggleTheme } = useTheme()
  const [page, setPage] = useState('dashboard')
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [thresholdOpen, setThresholdOpen] = useState(false)

  // Auth state — check localStorage on first load
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('wqm_user')
    return stored ? JSON.parse(stored) : null
  })

  function handleLogin(userData) { setUser(userData) }

  function handleLogout() {
    localStorage.removeItem('wqm_user')
    setUser(null)
  }

  // Not logged in → show login page
  if (!user) return <LoginPage onLogin={handleLogin} />

  const pageContent = {
    dashboard: <DashboardPage dark={dark} onOpenIncident={() => setIncidentOpen(true)} onOpenThreshold={() => setThresholdOpen(true)} />,
    readings: <ReadingsPage dark={dark} />,
    incidents: <IncidentsPage dark={dark} />,
    thresholds: <ThresholdsPage dark={dark} />,
    sensors: <SensorsPage dark={dark} />,
  }

  return (
    <div className={clsx(
      'flex h-screen overflow-hidden',
      dark ? 'bg-[#0f0e17] text-slate-100' : 'bg-slate-50 text-slate-900'
    )}>
      <Sidebar active={page} onNavigate={setPage} dark={dark} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar dark={dark} onToggleTheme={toggleTheme} page={page} user={user} onLogout={handleLogout} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {pageContent[page]}
        </main>
      </div>

      {/* Overlays */}
      <IncidentModal dark={dark} isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} />
      <ThresholdForm dark={dark} isOpen={thresholdOpen} onClose={() => setThresholdOpen(false)} />
    </div>
  )
}
