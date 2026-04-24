import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getReadings, createReading, getLines } from '../../services/api'
import clsx from 'clsx'

export function ReadingsPage({ dark }) {
  const qc = useQueryClient()
  const { data: lines } = useQuery('lines', getLines)
  const [lineId, setLineId] = useState('')
  const [form, setForm] = useState({ pH: '', turbidity: '', conductivity: '' })
  const [abtMessages, setAbtMessages] = useState([])

  const { data: readings, isLoading } = useQuery(
    ['readings-page', lineId],
    () => getReadings(lineId || undefined, 50),
    { refetchInterval: 15000 }
  )

  const createMut = useMutation(createReading, {
    onSuccess: (data) => {
      qc.invalidateQueries()
      setForm({ pH: '', turbidity: '', conductivity: '' })
      setAbtMessages(data.abtNotifications ?? [])
    }
  })

  const inputCls = clsx(
    'px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
    dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
  )

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Submit reading */}
      <div className={clsx('rounded-2xl p-5 border', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
        <h3 className={clsx('font-semibold mb-3', dark ? 'text-white' : 'text-slate-900')}>Submit Reading</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Line</label>
            <select value={form.lineId ?? ''} onChange={e => setForm(p => ({ ...p, lineId: parseInt(e.target.value) }))} className={inputCls}>
              <option value="">Select…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {['pH', 'turbidity', 'conductivity'].map(field => (
            <div key={field}>
              <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>{field}</label>
              <input
                type="number" step="0.01"
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder="0.00"
                className={inputCls + ' w-24'}
              />
            </div>
          ))}
          <button
            onClick={() => createMut.mutate({
              lineId: form.lineId,
              pH: parseFloat(form.pH),
              turbidity: parseFloat(form.turbidity),
              conductivity: parseFloat(form.conductivity)
            })}
            disabled={!form.lineId || !form.pH || !form.turbidity || !form.conductivity || createMut.isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
          >
            {createMut.isLoading ? 'Submitting…' : 'Submit'}
          </button>
        </div>

        {/* ABT notifications */}
        {abtMessages.map((msg, i) => (
          <div key={i} className={clsx(
            'mt-3 p-3 rounded-xl text-xs border-l-4 border-amber-500',
            dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-800'
          )}>
            <span className="font-semibold">ABT: </span>{msg}
          </div>
        ))}
      </div>

      {/* Line filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setLineId('')}
          className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
            !lineId ? 'bg-emerald-600 border-emerald-600 text-white' : dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
          )}
        >All Lines</button>
        {lines?.map(l => (
          <button
            key={l.id}
            onClick={() => setLineId(String(l.id))}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              lineId === String(l.id) ? 'bg-emerald-600 border-emerald-600 text-white' : dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
            )}
          >{l.name}</button>
        ))}
      </div>

      {/* Readings table */}
      <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'border-slate-700' : 'border-slate-200')}>
        <table className="w-full text-sm">
          <thead className={clsx('text-xs uppercase tracking-wide', dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500')}>
            <tr>
              {['Line', 'pH', 'Turbidity (NTU)', 'Conductivity (µS)', 'Timestamp'].map(h => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className={clsx('px-4 py-8 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>Loading…</td></tr>
            ) : readings?.map(r => (
              <tr key={r.id} className={clsx('border-t transition-colors', dark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50')}>
                <td className={clsx('px-4 py-3', dark ? 'text-slate-300' : 'text-slate-700')}>
                  {lines?.find(l => l.id === r.lineId)?.name ?? `Line ${r.lineId}`}
                </td>
                <td className="px-4 py-3 tabular-nums">{r.pH.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{r.turbidity.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{r.conductivity.toFixed(2)}</td>
                <td className={clsx('px-4 py-3 text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
                  {new Date(r.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
