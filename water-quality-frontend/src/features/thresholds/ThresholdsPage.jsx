import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getThresholds, getLines, updateThreshold, createThreshold, deleteThreshold } from '../../services/api'
import clsx from 'clsx'

const PAGE_SIZE = 10

const paramStyle = {
  pH:           { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
  Turbidity:    { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  Conductivity: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
}

function ParamBadge({ name }) {
  const s = paramStyle[name] ?? { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  return (
    <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', s.bg, s.text, s.border)}>
      {name}
    </span>
  )
}

export function ThresholdsPage({ dark }) {
  const qc = useQueryClient()
  const [selectedLine, setSelectedLine] = useState('')
  const [newForm, setNewForm] = useState({ parameterName: '', minValue: '', maxValue: '' })
  const [editing, setEditing] = useState({})
  const [page, setPage] = useState(1)

  const { data: lines } = useQuery('lines', getLines)
  const { data: thresholds, isLoading } = useQuery(
    ['thresholds-page', selectedLine],
    () => getThresholds(selectedLine ? parseInt(selectedLine) : undefined),
    { onSuccess: () => setPage(1) }
  )

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
    'px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
    dark ? 'bg-[#0f0e17] border-indigo-900/40 text-white' : 'bg-white border-slate-300 text-slate-900'
  )

  // Pagination
  const total = thresholds?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = thresholds?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? []
  const start = (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, total)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Line filter + count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedLine(''); setPage(1) }}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              !selectedLine ? 'bg-blue-600 border-blue-600 text-white' : dark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-300 text-slate-600'
            )}
          >All Lines</button>
          {lines?.map(l => (
            <button key={l.id}
              onClick={() => { setSelectedLine(String(l.id)); setPage(1) }}
              className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                selectedLine === String(l.id) ? 'bg-blue-600 border-blue-600 text-white' : dark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-300 text-slate-600'
              )}
            >{l.name}</button>
          ))}
        </div>
        {total > 0 && (
          <span className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
            {total} threshold{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'border-indigo-900/30' : 'border-slate-200')}>
        <table className="w-full text-sm">
          <thead className={clsx('text-xs uppercase tracking-wide', dark ? 'bg-[#130f24] text-slate-400' : 'bg-slate-50 text-slate-500')}>
            <tr>
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-4 py-3">Line</th>
              <th className="text-left px-4 py-3">Parameter</th>
              <th className="text-left px-4 py-3">Min Value</th>
              <th className="text-left px-4 py-3">Max Value</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className={clsx('px-4 py-10 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>Loading…</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className={clsx('px-4 py-10 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>No thresholds found</td></tr>
            ) : paginated.map((t, idx) => {
              const isEditing = !!editing[t.id]
              const e = editing[t.id] || { min: t.minValue, max: t.maxValue }
              const lineName = lines?.find(l => l.id === t.lineId)?.name ?? `Line ${t.lineId}`
              const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1
              return (
                <tr key={t.id} className={clsx('border-t transition-colors',
                  dark ? 'border-indigo-900/20 hover:bg-indigo-900/10' : 'border-slate-100 hover:bg-slate-50'
                )}>
                  {/* Row number */}
                  <td className={clsx('px-4 py-3 text-xs tabular-nums', dark ? 'text-slate-600' : 'text-slate-400')}>
                    {rowNum}
                  </td>
                  {/* Line */}
                  <td className={clsx('px-4 py-3 font-medium', dark ? 'text-slate-300' : 'text-slate-700')}>
                    {lineName}
                  </td>
                  {/* Parameter badge */}
                  <td className="px-4 py-3">
                    <ParamBadge name={t.parameterName} />
                  </td>
                  {/* Min */}
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="number" value={e.min} step="0.01" className={inputCls + ' w-24'}
                          onChange={ev => setEditing(p => ({ ...p, [t.id]: { ...e, min: ev.target.value } }))} />
                      : <span className={clsx('tabular-nums font-semibold', dark ? 'text-blue-300' : 'text-blue-600')}>{t.minValue.toFixed(2)}</span>
                    }
                  </td>
                  {/* Max */}
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="number" value={e.max} step="0.01" className={inputCls + ' w-24'}
                          onChange={ev => setEditing(p => ({ ...p, [t.id]: { ...e, max: ev.target.value } }))} />
                      : <span className={clsx('tabular-nums font-semibold', dark ? 'text-purple-300' : 'text-purple-600')}>{t.maxValue.toFixed(2)}</span>
                    }
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => updateMut.mutate({ id: t.id, min: e.min, max: e.max })}
                            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">Save</button>
                          <button onClick={() => setEditing(p => { const n = { ...p }; delete n[t.id]; return n })}
                            className={clsx('text-xs px-3 py-1 rounded-lg border transition-colors', dark ? 'border-slate-600 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50')}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditing(p => ({ ...p, [t.id]: { min: t.minValue, max: t.maxValue } }))}
                            className={clsx('text-xs px-3 py-1 rounded-lg border transition-colors', dark ? 'border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600')}>Edit</button>
                          <button onClick={() => deleteMut.mutate(t.id)}
                            className="text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination bar — inside the card */}
        {total > PAGE_SIZE && (
          <div className={clsx(
            'flex items-center justify-between px-4 py-3 border-t text-sm',
            dark ? 'border-indigo-900/30 bg-[#130f24]/60' : 'border-slate-200 bg-slate-50'
          )}>
            {/* Info */}
            <span className={clsx('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
              Showing {start}–{end} of {total}
            </span>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40',
                  dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-white'
                )}
              >← Prev</button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    'w-8 h-8 rounded-lg text-xs font-medium border transition-all',
                    safePage === p
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-white'
                  )}
                >{p}</button>
              ))}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40',
                  dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-white'
                )}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add threshold form */}
      <div className={clsx('rounded-2xl p-5 border', dark ? 'bg-[#1a1830]/70 border-indigo-900/30' : 'bg-white border-slate-200 shadow-sm')}>
        <h3 className={clsx('font-semibold mb-4', dark ? 'text-white' : 'text-slate-900')}>Add New Threshold</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-400' : 'text-slate-600')}>Line</label>
            <select value={newForm.lineId ?? ''} onChange={e => setNewForm(p => ({ ...p, lineId: parseInt(e.target.value) }))} className={inputCls}>
              <option value="">Select…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-400' : 'text-slate-600')}>Parameter</label>
            <input value={newForm.parameterName} onChange={e => setNewForm(p => ({ ...p, parameterName: e.target.value }))}
              placeholder="e.g. pH" className={inputCls + ' w-32'} />
          </div>
          <div>
            <label className={clsx('block text-xs font-medium mb-1.5 text-blue-400')}>Min Value</label>
            <input type="number" step="0.01" value={newForm.minValue ?? ''} onChange={e => setNewForm(p => ({ ...p, minValue: e.target.value }))}
              className={inputCls + ' w-24'} placeholder="0.00" />
          </div>
          <div>
            <label className={clsx('block text-xs font-medium mb-1.5 text-purple-400')}>Max Value</label>
            <input type="number" step="0.01" value={newForm.maxValue ?? ''} onChange={e => setNewForm(p => ({ ...p, maxValue: e.target.value }))}
              className={inputCls + ' w-24'} placeholder="0.00" />
          </div>
          <button
            onClick={() => createMut.mutate({ ...newForm, minValue: parseFloat(newForm.minValue), maxValue: parseFloat(newForm.maxValue) })}
            disabled={!newForm.lineId || !newForm.parameterName || !newForm.minValue || !newForm.maxValue || createMut.isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {createMut.isLoading ? 'Adding…' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
