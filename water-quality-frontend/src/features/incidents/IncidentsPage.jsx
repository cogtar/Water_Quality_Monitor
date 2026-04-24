import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getIncidents, resolveIncident, deleteIncident } from '../../services/api'
import clsx from 'clsx'

export function IncidentsPage({ dark }) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const params = filter === 'open' ? { resolved: false }
    : filter === 'resolved' ? { resolved: true }
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

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              filter === f.key
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : dark
                  ? 'border-slate-700 text-slate-400 hover:border-slate-500'
                  : 'border-slate-300 text-slate-600'
            )}
          >
            {f.label}
          </button>
        ))}
        <span className={clsx('ml-auto text-sm', dark ? 'text-slate-500' : 'text-slate-400')}>
          {incidents?.length ?? 0} records
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className={clsx('h-16 rounded-xl animate-pulse', dark ? 'bg-slate-800' : 'bg-slate-100')} />)}
        </div>
      ) : incidents?.length === 0 ? (
        <div className={clsx('text-center py-16', dark ? 'text-slate-500' : 'text-slate-400')}>
          No incidents found
        </div>
      ) : (
        <div className="space-y-2">
          {incidents?.map(inc => (
            <div key={inc.id} className={clsx(
              'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all',
              inc.resolvedStatus
                ? dark ? 'bg-slate-800/40 border-slate-700/50 opacity-70' : 'bg-slate-50 border-slate-200 opacity-70'
                : dark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx('font-semibold text-sm', dark ? 'text-white' : 'text-slate-900')}>
                    {inc.lineName}
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    inc.resolvedStatus
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  )}>
                    {inc.resolvedStatus ? 'Resolved' : 'Open'}
                  </span>
                </div>
                <p className={clsx('text-sm mt-0.5', dark ? 'text-slate-300' : 'text-slate-600')}>
                  {inc.parameter}: <span className="font-bold tabular-nums">{inc.value.toFixed(2)}</span>
                </p>
                <p className={clsx('text-xs mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                  {new Date(inc.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!inc.resolvedStatus && (
                  <button
                    onClick={() => resolveMut.mutate({ id: inc.id })}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => deleteMut.mutate(inc.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border',
                    dark ? 'border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400' : 'border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-500'
                  )}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
