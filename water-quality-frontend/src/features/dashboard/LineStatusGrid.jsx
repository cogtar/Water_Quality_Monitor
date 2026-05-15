import { useQuery } from 'react-query'
import { getLines, getReadings, getIncidents, getThresholds } from '../../services/api'
import clsx from 'clsx'

// Parse UTC timestamp correctly regardless of whether 'Z' suffix is present
function parseUTC(ts) {
  if (!ts) return null
  const s = String(ts)
  return new Date(s.endsWith('Z') ? s : s + 'Z')
}

function formatTime(ts) {
  const d = parseUTC(ts)
  if (!d) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

function StatusPulse({ ok }) {
  return (
    <span className="relative flex h-3 w-3">
      <span className={clsx(
        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
        ok ? 'bg-emerald-400' : 'bg-red-400'
      )} />
      <span className={clsx(
        'relative inline-flex rounded-full h-3 w-3',
        ok ? 'bg-emerald-500' : 'bg-red-500'
      )} />
    </span>
  )
}

function Stat({ label, value, unit, ok, dark }) {
  return (
    <div className={clsx(
      'flex flex-col gap-0.5 px-3 py-2 rounded-xl',
      dark ? 'bg-[#130f24]/80' : 'bg-slate-100'
    )}>
      <span className={clsx('text-xs font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
      <span className={clsx(
        'text-lg font-bold tabular-nums',
        ok === undefined
          ? (dark ? 'text-white' : 'text-slate-900')
          : ok ? 'text-emerald-400' : 'text-red-400'
      )}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span className="text-xs font-normal ml-1 opacity-60">{unit}</span>
      </span>
    </div>
  )
}

function LineCard({ line, dark }) {
  const { data: readings } = useQuery(
    ['readings', line.id, 'latest'],
    () => getReadings(line.id, 1),
    { refetchInterval: 10000 }
  )
  const { data: thresholds } = useQuery(['thresholds', line.id], () => getThresholds(line.id))
  const { data: incidents } = useQuery(
    ['incidents', line.id, 'open'],
    () => getIncidents({ lineId: line.id, resolved: false }),
    { refetchInterval: 10000 }
  )

  const latest = readings?.[0]
  const activeIncidents = incidents?.length ?? 0
  const lineOk = activeIncidents === 0

  function isInRange(param, value) {
    if (!thresholds || value == null) return undefined
    const t = thresholds.find(t => t.parameterName?.toLowerCase() === param.toLowerCase())
    if (!t) return undefined
    return value >= t.minValue && value <= t.maxValue
  }

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl p-5 border transition-all hover:scale-[1.01]',
      dark
        ? 'bg-[#1a1830]/70 backdrop-blur-md border-indigo-800/25 shadow-xl'
        : 'bg-white border-slate-200 shadow-md',
      !lineOk && 'border-red-500/40'
    )}>
      {/* Glow accent */}
      <div className={clsx(
        'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none',
        lineOk ? 'bg-emerald-400' : 'bg-red-400'
      )} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <StatusPulse ok={lineOk} />
            <h3 className={clsx('font-bold text-base', dark ? 'text-white' : 'text-slate-900')}>
              {line.name}
            </h3>
          </div>
          <p className={clsx('text-xs mt-0.5', dark ? 'text-slate-400' : 'text-slate-500')}>
            📍 {line.location}
          </p>
        </div>
        <div className={clsx(
          'text-xs font-semibold px-2.5 py-1 rounded-full border',
          lineOk
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'
        )}>
          {lineOk ? 'NOMINAL' : `${activeIncidents} ALERT${activeIncidents > 1 ? 'S' : ''}`}
        </div>
      </div>

      {/* Stats grid */}
      {latest ? (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="pH"           value={latest.pH}           unit=""    ok={isInRange('pH', latest.pH)}                   dark={dark} />
          <Stat label="Turbidity"    value={latest.turbidity}    unit="NTU" ok={isInRange('Turbidity', latest.turbidity)}     dark={dark} />
          <Stat label="Conductivity" value={latest.conductivity} unit="µS"  ok={isInRange('Conductivity', latest.conductivity)} dark={dark} />
        </div>
      ) : (
        <div className={clsx('text-center py-4 text-sm', dark ? 'text-slate-500' : 'text-slate-400')}>
          No readings yet
        </div>
      )}

      {/* Timestamp — correctly converted from UTC to local time */}
      {latest && (
        <p className={clsx('text-xs mt-3 flex items-center gap-1', dark ? 'text-slate-500' : 'text-slate-400')}>
          🕐 Last reading: <span className="font-medium">{formatTime(latest.timestamp)}</span>
        </p>
      )}
    </div>
  )
}

export function LineStatusGrid({ dark }) {
  const { data: lines, isLoading } = useQuery('lines', getLines, { refetchInterval: 30000 })

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={clsx('rounded-2xl h-44 animate-pulse', dark ? 'bg-slate-800' : 'bg-slate-100')} />
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lines?.map(line => <LineCard key={line.id} line={line} dark={dark} />)}
    </div>
  )
}
