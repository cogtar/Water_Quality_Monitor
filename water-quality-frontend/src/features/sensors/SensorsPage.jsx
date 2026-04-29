import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getSensors, getLines, createSensor, deleteSensor } from '../../services/api'
import clsx from 'clsx'

export function SensorsPage({ dark }) {
  const qc = useQueryClient()
  const { data: lines } = useQuery('lines', getLines)
  const { data: sensors, isLoading } = useQuery('sensors', () => getSensors())
  const [form, setForm] = useState({ lineId: '', type: '', lastCalibration: '' })
  const [error, setError] = useState('')

  const createMut = useMutation(createSensor, {
    onSuccess: () => {
      qc.invalidateQueries('sensors')
      setForm({ lineId: '', type: '', lastCalibration: '' })
      setError('')
    },
    onError: (err) => {
      const d = err?.response?.data
      setError(typeof d === 'string' ? d : d?.title ?? d?.detail ?? JSON.stringify(d) ?? 'Failed to register sensor. Is the backend running?')
    }
  })
  const deleteMut = useMutation(deleteSensor, { onSuccess: () => qc.invalidateQueries('sensors') })

  const inputCls = clsx(
    'px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
    dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
  )

  const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 86400000)

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Add sensor */}
      <div className={clsx('rounded-2xl p-5 border', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
        <h3 className={clsx('font-semibold mb-3', dark ? 'text-white' : 'text-slate-900')}>Register Sensor</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Line</label>
            <select value={form.lineId} onChange={e => setForm(p => ({ ...p, lineId: parseInt(e.target.value) }))} className={inputCls}>
              <option value="">Select…</option>
              {lines?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Type</label>
            <input value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              placeholder="e.g. pH Probe" className={inputCls + ' w-32'} />
          </div>
          <div>
            <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Last Calibration</label>
            <input type="date" value={form.lastCalibration} onChange={e => setForm(p => ({ ...p, lastCalibration: e.target.value }))}
              className={inputCls} />
          </div>
          <button
            onClick={() => createMut.mutate({ ...form, lastCalibration: new Date(form.lastCalibration).toISOString() })}
            disabled={!form.lineId || !form.type || !form.lastCalibration || createMut.isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
          >
            Register
          </button>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-xl text-xs border-l-4 border-red-500 bg-red-500/10 text-red-400">
            <span className="font-semibold">Error: </span>{String(error)}
          </div>
        )}
      </div>

      {/* Sensor cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className={clsx('h-28 rounded-xl animate-pulse', dark ? 'bg-slate-800' : 'bg-slate-100')} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sensors?.map(s => {
            const days = daysSince(s.lastCalibration)
            const overdue = days > 90
            const lineName = lines?.find(l => l.id === s.lineId)?.name ?? `Line ${s.lineId}`
            return (
              <div key={s.id} className={clsx(
                'rounded-xl p-4 border',
                overdue
                  ? dark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                  : dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={clsx('font-semibold', dark ? 'text-white' : 'text-slate-900')}>{s.type}</p>
                    <p className={clsx('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>{lineName}</p>
                  </div>
                  <button onClick={() => deleteMut.mutate(s.id)}
                    className="text-xs text-red-400 hover:text-red-300">✕</button>
                </div>
                <div className={clsx(
                  'text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 font-medium',
                  overdue ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                )}>
                  {overdue ? '⚠' : '✓'} Calibrated {days}d ago
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
