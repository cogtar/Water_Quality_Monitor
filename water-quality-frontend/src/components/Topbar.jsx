import clsx from 'clsx'

export function Topbar({ dark, onToggleTheme, page, user, onLogout }) {
  const titles = {
    dashboard:  'Dashboard',
    readings:   'Quality Readings',
    incidents:  'Incidents',
    thresholds: 'Thresholds',
    sensors:    'Sensors',
  }

  // Get initials from name e.g. "Admin User" → "AU"
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <header className={clsx(
      'flex items-center justify-between px-6 py-4 border-b',
      dark ? 'bg-[#09081a] border-indigo-900/40' : 'bg-white border-slate-200'
    )}>
      {/* Left — page title */}
      <div>
        <h1 className={clsx('text-lg font-semibold', dark ? 'text-white' : 'text-slate-900')}>
          {titles[page] || 'Water Quality Monitor'}
        </h1>
        <p className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Right — actions */}
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

        {/* Divider */}
        <div className={clsx('w-px h-6', dark ? 'bg-indigo-900/40' : 'bg-slate-200')} />

        {/* User avatar + name */}
        {user && (
          <div className="flex items-center gap-2">
            {/* Avatar circle with initials */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {/* Name — hidden on small screens */}
            <span className={clsx('text-sm font-medium hidden sm:block', dark ? 'text-slate-300' : 'text-slate-700')}>
              {user.name}
            </span>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={onLogout}
          className={clsx(
            'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
            dark
              ? 'border-indigo-900/40 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10'
              : 'border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50'
          )}
          title="Sign out"
        >
          Sign out
        </button>

      </div>
    </header>
  )
}
