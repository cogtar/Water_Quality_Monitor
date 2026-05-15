import { useQuery } from 'react-query'
import { getSensorDrift } from '../../services/api'
import clsx from 'clsx'

function DriftBadge({ value, dark }) {
  if (value == null || isNaN(value)) return <span className="text-xs text-slate-500">—</span>
  const abs = Math.abs(value)
  const isHigh = abs > 0.5
  const isPositive = value >= 0
  return (
    <span className={clsx(
      'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
      isHigh
        ? 'bg-red-500/20 text-red-400'
        : dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
    )}>
      {isPositive ? '+' : ''}{value.toFixed(2)}
    </span>
  )
}

export function SensorDrift({ dark }) {
  const { data, isLoading } = useQuery('sensor-drift', getSensorDrift, { refetchInterval: 30000 })

  return (
    <div className={clsx(
      'rounded-2xl p-5 border',
      dark ? 'bg-[#1a1830]/70 backdrop-blur-md border-indigo-800/25 shadow-xl' : 'bg-white border-slate-200 shadow-md'
    )}>
      <div className="mb-4">
        <h2 className={clsx('font-bold text-base', dark ? 'text-white' : 'text-slate-900')}>Sensor Drift</h2>
        <p className={clsx('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>
          Current vs. 24-hour average baseline
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className={clsx('h-12 rounded-xl animate-pulse', dark ? 'bg-slate-800' : 'bg-slate-100')} />)}
        </div>
      ) : !data?.length ? (
        <p className={clsx('text-sm', dark ? 'text-slate-500' : 'text-slate-400')}>Insufficient data for drift analysis</p>
      ) : (
        <div className="space-y-3">
          {data.map(d => (
            <div key={d.lineId} className={clsx(
              'rounded-xl p-3 border',
              dark ? 'bg-[#130f24]/80 border-indigo-900/30' : 'bg-slate-50 border-slate-200'
            )}>
              <p className={clsx('text-sm font-semibold mb-2', dark ? 'text-white' : 'text-slate-900')}>{d.lineName}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'pH', current: d.currentPH, drift: d.pHDrift },
                  { label: 'Turb', current: d.currentTurbidity, drift: d.turbidityDrift },
                  { label: 'Cond', current: d.currentConductivity, drift: d.conductivityDrift },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={clsx('mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>{item.label}</p>
                    <p className={clsx('font-bold', dark ? 'text-white' : 'text-slate-900')}>{item.current.toFixed(2)}</p>
                    <DriftBadge value={item.drift} dark={dark} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
