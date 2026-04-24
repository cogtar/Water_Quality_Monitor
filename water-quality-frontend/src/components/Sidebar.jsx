import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'readings', label: 'Readings', icon: '📈' },
  { id: 'incidents', label: 'Incidents', icon: '⚠️' },
  { id: 'thresholds', label: 'Thresholds', icon: '⚙️' },
  { id: 'sensors', label: 'Sensors', icon: '🔬' },
]

export function Sidebar({ active, onNavigate, dark }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-20 bg-black/60 md:hidden',
          collapsed ? 'hidden' : 'block'
        )}
        onClick={() => setCollapsed(true)}
      />

      {/* Sidebar */}
      <aside className={clsx(
        'fixed md:relative z-30 h-full flex flex-col transition-all duration-300',
        dark
          ? 'bg-slate-900 border-r border-slate-800'
          : 'bg-white border-r border-slate-200',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {/* Logo */}
        <div className={clsx(
          'flex items-center gap-3 px-4 py-5 border-b',
          dark ? 'border-slate-800' : 'border-slate-200'
        )}>
          <span className="text-2xl flex-shrink-0">💧</span>
          {!collapsed && (
            <div>
              <p className={clsx('font-bold text-sm leading-tight', dark ? 'text-emerald-400' : 'text-emerald-600')}>
                WaterQM
              </p>
              <p className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>Monitor Lite</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={clsx('ml-auto text-lg', dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active === item.id
                  ? dark
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : dark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className={clsx('px-4 py-3 text-xs border-t', dark ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-200')}>
            v1.0.0 · Lite
          </div>
        )}
      </aside>
    </>
  )
}
