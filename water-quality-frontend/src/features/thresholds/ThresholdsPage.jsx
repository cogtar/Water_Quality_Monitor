import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getThresholds, getLines, updateThreshold, createThreshold, deleteThreshold } from '../../services/api'
import clsx from 'clsx'

export function ThresholdsPage({ dark }) {
  const qc = useQueryClient()
  const [selectedLine, setSelectedLine] = useState('')
  const [newForm, setNewForm] = useState({ parameterName: '', minValue: '', maxValue: '' })

  const { data: lines } = useQuery('lines', getLines)
  const { data: thresholds, isLoading } = useQuery(
    ['thresholds-page', selectedLine],
    () => getThresholds(selectedLine ? parseInt(selectedLine) : undefined)
  )

  const [editing, setEditing] = useState({})

  const updateMut = useMutation(
    ({ id, min, max }) => updateThreshold(id, { minValue: parseFloat(min), maxValue: parseFloat(max) }),
    { onSuccess: () => { qc.invalidateQueries(); setEditing({}) } }
  )

  const createMut = useMutation(
    (data) => createThreshold(data),
    { onSuccess: () => { qc.invalidateQueries(); setNewForm({ parameterName: '', minValue: '', maxValue: '' }) } }
  )

  const deleteMut = useMutation(deleteThreshold, { onSuccess: () => qc.invalidateQueries() })

  const inputCls = clsx(
    'px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
    dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
  )

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Line filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedLine('')}
          className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
            !selectedLine
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
          )}
        >
          All Lines
        </button>
        {lines?.map(l => (
          <button
            key={l.id}
            onClick={() => setSelectedLine(String(l.id))}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              selectedLine === String(l.id)
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
            )}
          >
            {l.name}
          </button>
        ))}
      </div>

      {/* Threshold table */}
      <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'border-slate-700' : 'border-slate-200')}>
        <table className="w-full text-sm">
          <thead className={clsx('text-xs uppercase tracking-wide', dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500')}>
            <tr>
              {['Line', 'Parameter', 'Min', 'Max', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr><td colSpan={5} className={clsx('px-4 py-8 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>Loading…</td></tr>
            ) : thresholds?.map(t => {
              const isEditing = !!editing[t.id]
              const e = editing[t.id] || { min: t.minValue, max: t.maxValue }
              const lineName = lines?.find(l => l.id === t.lineId)?.name ?? `Line ${t.lineId}`
              return (
                <tr key={t.id} className={clsx(dark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50')}>
                  <td className={clsx('px-4 py-3', dark ? 'text-slate-300' : 'text-slate-700')}>{lineName}</td>
                  <td className={clsx('px-4 py-3 font-medium', dark ? 'text-white' : 'text-slate-900')}>{t.parameterName}</td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="number" value={e.min} step="0.01" className={inputCls + ' w-20'}
                          onChange={ev => setEditing(p => ({ ...p, [t.id]: { ...e, min: ev.target.value } }))} />
                      : <span className="tabular-nums">{t.minValue.toFixed(2)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="number" value={e.max} step="0.01" className={inputCls + ' w-20'}
                          onChange={ev => setEditing(p => ({ ...p, [t.id]: { ...e, max: ev.target.value } }))} />
                      : <span className="tabular-nums">{t.maxValue.toFixed(2)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => updateMut.mutate({ id: t.id, min: e.min, max: e.max })}
                            className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">Save</button>
                          <button onClick={() => setEditing(p => { const n = { ...p }; delete n[t.id]; return n })}
                            className={clsx('text-xs px-3 py-1 rounded-lg border', dark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-500')}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditing(p => ({ ...p, [t.id]: { min: t.minValue, max: t.maxValue } }))}
                            className={clsx('text-xs px-3 py-1 rounded-lg border', dark ? 'border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400' : 'border-slate-300 text-slate-500')}>Edit</button>
                          <button onClick={() => deleteMut.mutate(t.id)}
                            className="text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">Del</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add new */}
      <div className={clsx('rounded-2xl p-5 border', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
        <h3 className={clsx('font-semibold mb-3', dark ? 'text-white' : 'text-slate-900')}>Add Threshold</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Line</label>
            <select value={newForm.lineId ?? ''} onChange={e => setNewForm(p => ({ ...p, lineId: parseInt(e.target.value) }))} className={inputCls}>
              <option value="">Select…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Parameter</label>
            <input value={newForm.parameterName} onChange={e => setNewForm(p => ({ ...p, parameterName: e.target.value }))}
              placeholder="e.g. pH" className={inputCls + ' w-28'} />
          </div>
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Min</label>
            <input type="number" step="0.01" value={newForm.minValue} onChange={e => setNewForm(p => ({ ...p, minValue: e.target.value }))}
              className={inputCls + ' w-20'} />
          </div>
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Max</label>
            <input type="number" step="0.01" value={newForm.maxValue} onChange={e => setNewForm(p => ({ ...p, maxValue: e.target.value }))}
              className={inputCls + ' w-20'} />
          </div>
          <button
            onClick={() => createMut.mutate({ ...newForm, minValue: parseFloat(newForm.minValue), maxValue: parseFloat(newForm.maxValue) })}
            disabled={!newForm.lineId || !newForm.parameterName || !newForm.minValue || !newForm.maxValue}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
