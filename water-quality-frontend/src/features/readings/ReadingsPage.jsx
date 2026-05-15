import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getReadings, createReading, getLines } from '../../services/api'
import clsx from 'clsx'

/* Always parse backend timestamps as UTC (backend omits the 'Z') */
function parseUTC(ts) {
  if (!ts) return null
  const s = String(ts)
  return new Date(s.endsWith('Z') ? s : s + 'Z')
}

/* ── Toast notification ───────────────────────────────────────── */
function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // slide in
    const showTimer = setTimeout(() => setVisible(true), 50)
    // start slide out after 4s
    const hideTimer = setTimeout(() => setVisible(false), 4000)
    // remove from DOM after slide out completes (300ms transition)
    const doneTimer = setTimeout(() => onDone(), 4350)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); clearTimeout(doneTimer) }
  }, [])

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border-l-4 border-amber-500 bg-slate-900 text-white max-w-sm w-full text-sm transition-all duration-300 ease-in-out',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    )}>
      <span className="text-amber-400 text-base mt-0.5 flex-shrink-0">⚠</span>
      <p className="text-slate-200 leading-snug">{message}</p>
    </div>
  )
}

/* ── Toast container (fixed top-right) ───────────────────────── */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} onDone={() => onRemove(t.id)} />
      ))}
    </div>
  )
}

/* ── Reading modal ────────────────────────────────────────────── */
function ReadingModal({ dark, onClose, onToasts, lines }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ lineId: '', pH: '', turbidity: '', conductivity: '' })

  const createMut = useMutation(createReading, {
    onSuccess: (data) => {
      qc.invalidateQueries()
      const msgs = data.abtNotifications ?? []
      onClose()
      if (msgs.length > 0) onToasts(msgs)
    }
  })

  const inputCls = clsx(
    'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
    dark ? 'bg-[#0f0e17] border-indigo-900/40 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={clsx(
        'w-full max-w-md rounded-2xl shadow-2xl border',
        dark ? 'bg-[#0f0e17] border-indigo-900/40' : 'bg-white border-slate-200'
      )}>
        {/* Header */}
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b', dark ? 'border-indigo-900/30' : 'border-slate-200')}>
          <div>
            <h2 className={clsx('font-bold text-base', dark ? 'text-white' : 'text-slate-900')}>New Quality Reading</h2>
            <p className={clsx('text-xs mt-0.5', dark ? 'text-slate-400' : 'text-slate-500')}>Enter sensor values for a production line</p>
          </div>
          <button onClick={onClose} className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors', dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}>✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-400' : 'text-slate-600')}>Production Line</label>
            <select value={form.lineId} onChange={e => setForm(p => ({ ...p, lineId: parseInt(e.target.value) }))} className={inputCls}>
              <option value="">Select a line…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { field: 'pH',           label: 'pH',               color: 'text-blue-400'   },
              { field: 'turbidity',    label: 'Turbidity (NTU)',   color: 'text-amber-400'  },
              { field: 'conductivity', label: 'Conductivity (µS)', color: 'text-purple-400' },
            ].map(({ field, label, color }) => (
              <div key={field}>
                <label className={clsx('block text-xs font-medium mb-1.5', color)}>{label}</label>
                <input
                  type="number" step="0.01"
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={clsx('flex items-center justify-end gap-3 px-6 py-4 border-t', dark ? 'border-indigo-900/30' : 'border-slate-200')}>
          <button onClick={onClose} className={clsx('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', dark ? 'border-slate-600 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>
            Close
          </button>
          <button
            onClick={() => createMut.mutate({
              lineId: form.lineId,
              pH: parseFloat(form.pH),
              turbidity: parseFloat(form.turbidity),
              conductivity: parseFloat(form.conductivity)
            })}
            disabled={!form.lineId || !form.pH || !form.turbidity || !form.conductivity || createMut.isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {createMut.isLoading ? 'Submitting…' : 'Submit Reading'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export function ReadingsPage({ dark }) {
  const { data: lines } = useQuery('lines', getLines)
  const [lineId, setLineId]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toasts, setToasts]       = useState([])

  const { data: readings, isLoading } = useQuery(
    ['readings-page', lineId],
    () => getReadings(lineId || undefined, 50),
    { refetchInterval: 15000 }
  )

  function addToasts(messages) {
    const newToasts = messages.map(msg => ({ id: Date.now() + Math.random(), message: msg }))
    setToasts(prev => [...prev, ...newToasts])
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Toast container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Modal */}
      {showModal && (
        <ReadingModal
          dark={dark}
          lines={lines}
          onClose={() => setShowModal(false)}
          onToasts={addToasts}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLineId('')}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              !lineId ? 'bg-blue-600 border-blue-600 text-white' : dark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-300 text-slate-600 hover:border-slate-400'
            )}
          >All Lines</button>
          {lines?.map(l => (
            <button key={l.id}
              onClick={() => setLineId(String(l.id))}
              className={clsx('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                lineId === String(l.id) ? 'bg-blue-600 border-blue-600 text-white' : dark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-300 text-slate-600 hover:border-slate-400'
              )}
            >{l.name}</button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <span className="text-lg leading-none">+</span> New Reading
        </button>
      </div>

      {/* Readings table */}
      <div className={clsx('rounded-2xl border overflow-hidden', dark ? 'border-indigo-900/30' : 'border-slate-200')}>
        <table className="w-full text-sm">
          <thead className={clsx('text-xs uppercase tracking-wide', dark ? 'bg-[#130f24] text-slate-400' : 'bg-slate-50 text-slate-500')}>
            <tr>
              <th className="text-left px-4 py-3">Line</th>
              <th className="text-left px-4 py-3 text-blue-400">pH</th>
              <th className="text-left px-4 py-3 text-amber-400">Turbidity (NTU)</th>
              <th className="text-left px-4 py-3 text-purple-400">Conductivity (µS)</th>
              <th className="text-left px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className={clsx('px-4 py-10 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>Loading…</td></tr>
            ) : readings?.length === 0 ? (
              <tr><td colSpan={5} className={clsx('px-4 py-10 text-center', dark ? 'text-slate-500' : 'text-slate-400')}>No readings yet — click <strong className="text-blue-400">+ New Reading</strong> to add one</td></tr>
            ) : readings?.map(r => (
              <tr key={r.id} className={clsx('border-t transition-colors', dark ? 'border-indigo-900/20 hover:bg-indigo-900/10' : 'border-slate-100 hover:bg-slate-50')}>
                <td className={clsx('px-4 py-3 font-medium', dark ? 'text-slate-300' : 'text-slate-700')}>
                  {lines?.find(l => l.id === r.lineId)?.name ?? `Line ${r.lineId}`}
                </td>
                <td className="px-4 py-3 tabular-nums text-blue-400 font-semibold">{r.pH.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums text-amber-400 font-semibold">{r.turbidity.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums text-purple-400 font-semibold">{r.conductivity.toFixed(2)}</td>
                <td className={clsx('px-4 py-3 text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>
                  {parseUTC(r.timestamp)?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
