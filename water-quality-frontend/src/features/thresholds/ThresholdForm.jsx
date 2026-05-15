import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { getThresholds, getLines, updateThreshold, createThreshold } from '../../services/api'
import clsx from 'clsx'

export function ThresholdForm({ dark, isOpen, onClose }) {
  const qc = useQueryClient()
  const [selectedLine, setSelectedLine] = useState('')
  const [editing, setEditing] = useState({})

  const { data: lines } = useQuery('lines', () => import('../../services/api').then(m => m.getLines()))
  const { data: thresholds } = useQuery(
    ['thresholds', selectedLine],
    () => getThresholds(selectedLine ? parseInt(selectedLine) : undefined),
    { enabled: !!selectedLine }
  )

  useEffect(() => {
    if (thresholds) {
      const init = {}
      thresholds.forEach(t => { init[t.id] = { min: t.minValue, max: t.maxValue } })
      setEditing(init)
    }
  }, [thresholds])

  const updateMut = useMutation(
    ({ id, min, max }) => updateThreshold(id, { minValue: min, maxValue: max }),
    {
      onSuccess: () => {
        qc.invalidateQueries(['thresholds', selectedLine])
        qc.invalidateQueries('thresholds')
      }
    }
  )

  if (!isOpen) return null

  const inputCls = clsx(
    'w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
    dark ? 'bg-[#0f0e17] border-indigo-900/40 text-white' : 'bg-white border-slate-300 text-slate-900'
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over panel */}
      <div className={clsx(
        'fixed right-0 top-0 h-full z-50 w-full max-w-sm shadow-2xl border-l flex flex-col',
        dark ? 'bg-[#13112a] border-indigo-900/40' : 'bg-white border-slate-200'
      )}>
        {/* Header */}
        <div className={clsx('flex items-center justify-between px-5 py-4 border-b', dark ? 'border-indigo-900/30' : 'border-slate-100')}>
          <div>
            <h2 className={clsx('font-bold', dark ? 'text-white' : 'text-slate-900')}>Threshold Editor</h2>
            <p className={clsx('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>Live-edit sensor limits</p>
          </div>
          <button onClick={onClose} className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-lg', dark ? 'hover:bg-indigo-900/30 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}>✕</button>
        </div>

        {/* Line selector */}
        <div className="px-5 py-4">
          <label className={clsx('block text-xs font-medium mb-1.5', dark ? 'text-slate-400' : 'text-slate-500')}>
            Select Line
          </label>
          <select
            value={selectedLine}
            onChange={e => setSelectedLine(e.target.value)}
            className={inputCls}
          >
            <option value="">Choose a line…</option>
            {lines?.map(l => <option key={l.id} value={l.id}>{l.name} — {l.location}</option>)}
          </select>
        </div>

        {/* Thresholds list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {!selectedLine && (
            <p className={clsx('text-sm text-center mt-8', dark ? 'text-slate-500' : 'text-slate-400')}>
              Select a line to edit thresholds
            </p>
          )}
          {thresholds?.map(t => {
            const e = editing[t.id] || { min: t.minValue, max: t.maxValue }
            const dirty = e.min !== t.minValue || e.max !== t.maxValue
            return (
              <div key={t.id} className={clsx(
                'rounded-xl p-4 border',
                dark ? 'bg-[#1a1830]/70 border-indigo-900/30' : 'bg-slate-50 border-slate-200'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={clsx('font-semibold text-sm', dark ? 'text-white' : 'text-slate-900')}>
                    {t.parameterName}
                  </span>
                  {dirty && (
                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                      unsaved
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Min</label>
                    <input
                      type="number"
                      value={e.min}
                      step="0.01"
                      onChange={ev => setEditing(prev => ({
                        ...prev,
                        [t.id]: { ...e, min: parseFloat(ev.target.value) }
                      }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-xs mb-1', dark ? 'text-slate-400' : 'text-slate-500')}>Max</label>
                    <input
                      type="number"
                      value={e.max}
                      step="0.01"
                      onChange={ev => setEditing(prev => ({
                        ...prev,
                        [t.id]: { ...e, max: parseFloat(ev.target.value) }
                      }))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button
                  disabled={!dirty || updateMut.isLoading}
                  onClick={() => updateMut.mutate({ id: t.id, min: e.min, max: e.max })}
                  className={clsx(
                    'w-full py-1.5 rounded-lg text-sm font-medium transition-colors',
                    dirty
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : dark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {updateMut.isLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
