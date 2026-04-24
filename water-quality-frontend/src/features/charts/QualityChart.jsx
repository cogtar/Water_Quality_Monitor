import { useQuery } from 'react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts'
import { getReadings, getThresholds, getLines } from '../../services/api'
import { useState } from 'react'
import clsx from 'clsx'

const PARAMS = [
  { key: 'pH',           label: 'pH',          color: '#10b981', unit: '',     threshKey: 'pH'          },
  { key: 'turbidity',    label: 'Turbidity',   color: '#f59e0b', unit: 'NTU',  threshKey: 'Turbidity'   },
  { key: 'conductivity', label: 'Conductivity',color: '#6366f1', unit: 'µS/cm',threshKey: 'Conductivity'},
]

function parseUTC(ts) {
  if (!ts) return 0
  const s = String(ts)
  return new Date(s.endsWith('Z') ? s : s + 'Z').getTime()
}

function MiniTooltip({ active, payload, label, unit, color, dark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={clsx(
      'rounded-lg shadow-xl border px-3 py-2 text-xs',
      dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'
    )}>
      <p className={clsx('mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>
        {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
      </p>
      <p className="font-bold" style={{ color }}>
        {Number(payload[0]?.value).toFixed(2)}
        <span className="ml-1 font-normal opacity-70">{unit}</span>
      </p>
    </div>
  )
}

function ParamChart({ param, chartData, threshold, dark }) {
  const latest  = chartData[chartData.length - 1]?.[param.key]
  const inRange = threshold
    ? latest >= threshold.minValue && latest <= threshold.maxValue
    : null

  // Pad Y domain so threshold lines don't sit on edge
  const pad   = threshold ? (threshold.maxValue - threshold.minValue) * 0.4 : 2
  const yMin  = threshold ? Math.max(0, threshold.minValue - pad) : 'auto'
  const yMax  = threshold ? threshold.maxValue + pad : 'auto'

  return (
    <div className={clsx(
      'rounded-xl p-4 border flex flex-col gap-3',
      dark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
    )}>
      {/* Mini header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: param.color }} />
          <span className={clsx('text-sm font-semibold', dark ? 'text-white' : 'text-slate-800')}>
            {param.label}
          </span>
          {param.unit && (
            <span className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
              ({param.unit})
            </span>
          )}
        </div>
        {/* Current value badge */}
        {latest != null && (
          <div className={clsx(
            'text-xs font-bold px-2.5 py-1 rounded-lg',
            inRange === true  ? 'bg-emerald-500/20 text-emerald-400' :
            inRange === false ? 'bg-red-500/20 text-red-400' :
            dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
          )}>
            {Number(latest).toFixed(2)}
            {inRange === false && ' ⚠'}
          </div>
        )}
      </div>

      {/* Threshold range hint */}
      {threshold && (
        <p className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
          Safe range:&nbsp;
          <span className="font-semibold" style={{ color: param.color }}>
            {threshold.minValue} – {threshold.maxValue} {param.unit}
          </span>
        </p>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${param.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={param.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={param.color} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#f1f5f9'} vertical={false} />

          <XAxis
            dataKey="time"
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={v => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            tick={{ fontSize: 9, fill: dark ? '#475569' : '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 9, fill: dark ? '#475569' : '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />

          <Tooltip content={<MiniTooltip unit={param.unit} color={param.color} dark={dark} />} />

          {/* Safe band shading */}
          {threshold && (
            <ReferenceArea
              y1={threshold.minValue}
              y2={threshold.maxValue}
              fill={param.color}
              fillOpacity={0.07}
            />
          )}
          {/* Min / Max lines */}
          {threshold && (
            <ReferenceLine y={threshold.minValue} stroke={param.color} strokeDasharray="4 3" strokeOpacity={0.6} />
          )}
          {threshold && (
            <ReferenceLine y={threshold.maxValue} stroke={param.color} strokeDasharray="4 3" strokeOpacity={0.6} />
          )}

          <Area
            type="monotone"
            dataKey={param.key}
            stroke={param.color}
            strokeWidth={2}
            fill={`url(#grad-${param.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function QualityChart({ lineId: initialLineId, dark }) {
  const [selectedLineId, setSelectedLineId] = useState(initialLineId)

  const { data: lines }     = useQuery('lines', getLines)
  const { data: readings, isLoading } = useQuery(
    ['readings', selectedLineId, 'chart'],
    () => getReadings(selectedLineId, 50),
    { refetchInterval: 15000, enabled: !!selectedLineId, keepPreviousData: false }
  )
  const { data: thresholds } = useQuery(
    ['thresholds', selectedLineId],
    () => getThresholds(selectedLineId),
    { enabled: !!selectedLineId }
  )

  const selectedLineName = lines?.find(l => l.id === selectedLineId)?.name ?? ''

  const chartData = [...(readings || [])]
    .reverse()
    .map(r => ({
      time:         parseUTC(r.timestamp),
      pH:           r.pH,
      turbidity:    r.turbidity,
      conductivity: r.conductivity,
    }))

  function getT(key) {
    return thresholds?.find(t => t.parameterName?.toLowerCase() === key.toLowerCase()) ?? null
  }

  return (
    <div className={clsx(
      'rounded-2xl p-5 border',
      dark ? 'bg-white/5 backdrop-blur-md border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-md'
    )}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={clsx('font-bold text-base', dark ? 'text-white' : 'text-slate-900')}>
            Quality Trend
            {selectedLineName && (
              <span className="ml-2 text-sm font-normal text-emerald-400">— {selectedLineName}</span>
            )}
          </h2>
          <p className={clsx('text-xs mt-0.5', dark ? 'text-slate-400' : 'text-slate-500')}>
            {chartData.length} readings · shaded area = safe threshold range
          </p>
        </div>

        {/* Line selector */}
        <div className={clsx(
          'flex gap-1 flex-wrap p-1 rounded-xl',
          dark ? 'bg-slate-800' : 'bg-slate-100'
        )}>
          {lines?.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLineId(l.id)}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                selectedLineId === l.id
                  ? 'bg-emerald-600 text-white shadow'
                  : dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className={clsx('h-48 rounded-xl animate-pulse', dark ? 'bg-slate-800' : 'bg-slate-100')} />
          ))}
        </div>
      ) : chartData.length < 2 ? (
        <div className={clsx(
          'h-48 flex flex-col items-center justify-center gap-2 text-sm rounded-xl border border-dashed',
          dark ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-300'
        )}>
          <span className="text-3xl">📊</span>
          <span className="font-medium">No data for {selectedLineName}</span>
          <span className="text-xs opacity-70">
            Click <strong className="text-indigo-400">⚡ Generate Demo Data</strong> with this line selected
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PARAMS.map(p => (
            <ParamChart
              key={p.key}
              param={p}
              chartData={chartData}
              threshold={getT(p.threshKey)}
              dark={dark}
            />
          ))}
        </div>
      )}
    </div>
  )
}
