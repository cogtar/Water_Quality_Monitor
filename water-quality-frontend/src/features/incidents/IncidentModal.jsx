import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { createIncident, resolveIncident, getIncidents, getLines } from '../../services/api'
import clsx from 'clsx'

const PARAMS = ['pH', 'Turbidity', 'Conductivity']

function AbtBanner({ message, dark }) {
  return (
    <div className={clsx(
      'rounded-xl p-3 text-xs border-l-4 border-amber-500 mt-3',
      dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-800'
    )}>
      <span className="font-semibold">ABT Notification: </span>{message}
    </div>
  )
}

export function IncidentModal({ dark, isOpen, onClose }) {
  const qc = useQueryClient()
  const [lineId, setLineId] = useState('')
  const [parameter, setParameter] = useState('pH')
  const [value, setValue] = useState('')
  const [abtMessage, setAbtMessage] = useState('')

  const { data: lines } = useQuery('lines', () => import('../../services/api').then(m => m.getLines()))
  const { data: incidents, isLoading } = useQuery('incidents-all', () => getIncidents(), { enabled: isOpen })

  const createMut = useMutation(createIncident, {
    onSuccess: (data) => {
      qc.invalidateQueries('incidents-all')
      qc.invalidateQueries('incidents')
      const lineName = lines?.find(l => l.id === parseInt(lineId))?.name ?? 'Unknown'
      setAbtMessage(
        `Reading ${parameter} is ${Number(value).toFixed(2)} and was manually flagged for line "${lineName}", ` +
        `but this incident was submitted outside auto-detection, ` +
        `therefore a manual incident record has been created.`
      )
      setLineId(''); setParameter('pH'); setValue('')
    }
  })

  const resolveMut = useMutation(
    ({ id, status }) => resolveIncident(id, status),
    { onSuccess: () => qc.invalidateQueries('incidents-all') }
  )

  if (!isOpen) return null

  const inputCls = dark
    ? 'w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm'
    : 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={clsx(
        'relative w-full max-w-lg rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto',
        dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      )}>
        {/* Header */}
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b', dark ? 'border-slate-800' : 'border-slate-100')}>
          <div>
            <h2 className={clsx('font-bold text-base', dark ? 'text-white' : 'text-slate-900')}>Incident Log</h2>
            <p className={clsx('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>Manual incident creation & resolution</p>
          </div>
          <button onClick={onClose} className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}>✕</button>
        </div>

        {/* Create form */}
        <div className="px-6 py-4">
          <h3 className={clsx('text-sm font-semibold mb-3', dark ? 'text-slate-200' : 'text-slate-700')}>Log New Incident</h3>
          <div className="space-y-3">
            <select value={lineId} onChange={e => setLineId(e.target.value)} className={inputCls}>
              <option value="">Select Line…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={parameter} onChange={e => setParameter(e.target.value)} className={inputCls}>
                {PARAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="number"
                placeholder="Value"
                value={value}
                onChange={e => setValue(e.target.value)}
                className={inputCls}
                step="0.01"
              />
            </div>
            <button
              onClick={() => createMut.mutate({ lineId: parseInt(lineId), parameter, value: parseFloat(value) })}
              disabled={!lineId || !value || createMut.isLoading}
              className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {createMut.isLoading ? 'Logging…' : 'Log Incident'}
            </button>
          </div>
          {abtMessage && <AbtBanner message={abtMessage} dark={dark} />}
        </div>

        {/* Incident list */}
        <div className={clsx('px-6 pb-6 border-t', dark ? 'border-slate-800' : 'border-slate-100')}>
          <h3 className={clsx('text-sm font-semibold mb-3 mt-4', dark ? 'text-slate-200' : 'text-slate-700')}>
            Open Incidents
          </h3>
          {isLoading ? (
            <div className={clsx('text-sm', dark ? 'text-slate-500' : 'text-slate-400')}>Loading…</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {incidents?.filter(i => !i.resolvedStatus).length === 0 && (
                <p className={clsx('text-sm', dark ? 'text-slate-500' : 'text-slate-400')}>No open incidents 🎉</p>
              )}
              {incidents?.filter(i => !i.resolvedStatus).map(inc => (
                <div key={inc.id} className={clsx(
                  'flex items-center justify-between gap-2 p-3 rounded-xl border',
                  dark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                )}>
                  <div>
                    <p className={clsx('text-sm font-medium', dark ? 'text-red-300' : 'text-red-700')}>
                      {inc.lineName} · {inc.parameter} = {inc.value.toFixed(2)}
                    </p>
                    <p className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
                      {new Date(inc.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveMut.mutate({ id: inc.id, status: true })}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex-shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
