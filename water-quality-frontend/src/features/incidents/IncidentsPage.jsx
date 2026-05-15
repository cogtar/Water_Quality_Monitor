import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getIncidents, resolveIncident, deleteIncident } from '../../services/api'
import clsx from 'clsx'

/* Always parse backend timestamps as UTC (backend omits the 'Z') */
function parseUTC(ts) {
  if (!ts) return null
  const s = String(ts)
  return new Date(s.endsWith('Z') ? s : s + 'Z')
}

const FILTERS = [
  { key: 'all',      label: 'All'        },
  { key: 'open',     label: 'Unresolved' },
  { key: 'resolved', label: 'Resolved'   },
]

const paramColor = {
  pH:           { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
  Turbidity:    { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  Conductivity: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
}

export function IncidentsPage({ dark }) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const params = filter === 'open'     ? { resolved: false }
               : filter === 'resolved' ? { resolved: true  }
               : {}

  const { data: incidents, isLoading } = useQuery(
    ['incidents-page', filter],
    () => getIncidents(params),
    { refetchInterval: 15000 }
  )

  const resolveMut = useMutation(
    ({ id }) => resolveIncident(id, true),
    { onSuccess: () => qc.invalidateQueries() }
  )
  const deleteMut = useMutation(
    (id) => deleteIncident(id),
    { onSuccess: () => qc.invalidateQueries() }
  )

  const unresolvedCount = incidents?.filter(i => !i.resolvedStatus).length ?? 0
  const resolvedCount   = incidents?.filter(i =>  i.resolvedStatus).length ?? 0

  return (
    <div className="space-y-4 max-w-5xl">

      {/* Header row — filter tabs + summary badges */}
      <div className="flex items-center justify-between flex-wrap gap-3">

        {/* Filter tabs */}
        <div className={clsx('flex gap-1 p-1 rounded-xl', dark ? 'bg-[#130f24]' : 'bg-slate-100')}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === f.key
                  ? dark ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow'
                  : dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              )}
            >{f.label}</button>
          ))}
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            {unresolvedCount} Unresolved
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {resolvedCount} Resolved
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'border-indigo-900/30' : 'border-slate-200')}>
        <table className="w-full text-sm">
          <thead className={clsx('text-xs uppercase tracking-wide', dark ? 'bg-[#130f24] text-slate-400' : 'bg-slate-50 text-slate-500')}>
            <tr>
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-4 py-3">Line</th>
              <th className="text-left px-4 py-3">Parameter</th>
              <th className="text-left px-4 py-3">Value</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              /* Skeleton rows */
              [1,2,3,4].map(i => (
                <tr key={i} className={clsx('border-t', dark ? 'border-slate-800' : 'border-slate-100')}>
                  {[1,2,3,4,5,6,7].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className={clsx('h-4 rounded animate-pulse', dark ? 'bg-[#130f24]' : 'bg-slate-100')} />
                    </td>
                  ))}
                </tr>
              ))
            ) : incidents?.length === 0 ? (
              <tr>
                <td colSpan={7} className={clsx('px-4 py-14 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">✅</span>
                    <span className="font-medium">No incidents found</span>
                    <span className="text-xs opacity-60">All clear for the selected filter</span>
                  </div>
                </td>
              </tr>
            ) : incidents?.map((inc, idx) => {
              const pc = paramColor[inc.parameter] ?? { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
              return (
                <tr
                  key={inc.id}
                  className={clsx(
                    'border-t transition-colors',
                    inc.resolvedStatus
                      ? dark ? 'border-indigo-900/20 hover:bg-indigo-900/10 opacity-60' : 'border-slate-100 hover:bg-slate-50 opacity-70'
                      : dark ? 'border-indigo-900/20 hover:bg-red-500/5' : 'border-slate-100 hover:bg-red-50/60'
                  )}
                >
                  {/* Row number */}
                  <td className={clsx('px-4 py-3 text-xs tabular-nums', dark ? 'text-slate-600' : 'text-slate-400')}>
                    {idx + 1}
                  </td>

                  {/* Line — with red dot for unresolved */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!inc.resolvedStatus && (
                        <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
                      )}
                      <span className={clsx('font-semibold', dark ? 'text-white' : 'text-slate-900')}>
                        {inc.lineName}
                      </span>
                    </div>
                  </td>

                  {/* Parameter badge */}
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', pc.bg, pc.text, pc.border)}>
                      {inc.parameter}
                    </span>
                  </td>

                  {/* Value */}
                  <td className={clsx('px-4 py-3 font-bold tabular-nums', inc.resolvedStatus ? (dark ? 'text-slate-400' : 'text-slate-500') : 'text-red-400')}>
                    {inc.value.toFixed(2)}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    {inc.resolvedStatus ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        ● Unresolved
                      </span>
                    )}
                  </td>

                  {/* Time */}
                  <td className={clsx('px-4 py-3 text-xs whitespace-nowrap', dark ? 'text-slate-500' : 'text-slate-400')}>
                    {parseUTC(inc.timestamp)?.toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!inc.resolvedStatus && (
                        <button
                          onClick={() => resolveMut.mutate({ id: inc.id })}
                          className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                        >
                          ✓ Resolve
                        </button>
                      )}
                      <button
                        onClick={() => deleteMut.mutate(inc.id)}
                        className={clsx(
                          'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                          dark
                            ? 'border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10'
                            : 'border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50'
                        )}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
