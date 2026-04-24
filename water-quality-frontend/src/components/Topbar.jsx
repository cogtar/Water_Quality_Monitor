import clsx from 'clsx'

export function Topbar({ dark, onToggleTheme, page }) {
  const titles = {
    dashboard: 'Dashboard',
    readings: 'Quality Readings',
    incidents: 'Incidents',
    thresholds: 'Thresholds',
    sensors: 'Sensors',
  }

  return (
    <header className={clsx(
      'flex items-center justify-between px-6 py-4 border-b',
      dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    )}>
      <div>
        <h1 className={clsx('text-lg font-semibold', dark ? 'text-white' : 'text-slate-900')}>
          {titles[page] || 'Water Quality Monitor'}
        </h1>
        <p className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-600/30">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">LIVE</span>
        </div>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-lg',
            dark ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          )}
          title="Toggle theme"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
