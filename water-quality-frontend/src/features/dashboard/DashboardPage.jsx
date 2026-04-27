import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { getLines, createReading } from '../../services/api'
import { LineStatusGrid } from './LineStatusGrid'
import { QualityChart } from '../charts/QualityChart'
import { SensorDrift } from './SensorDrift'
import clsx from 'clsx'

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export function DashboardPage({ dark, onOpenIncident, onOpenThreshold }) {
  const { data: lines } = useQuery('lines', getLines)
  const [selectedLine, setSelectedLine] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [seedCount, setSeedCount] = useState(0)
  const qc = useQueryClient()

  const activeLineId = selectedLine ?? lines?.[0]?.id

  async function seedDemoData() {
    if (!activeLineId) return
    setSeeding(true)
    setSeedCount(0)
    let created = 0
    for (let i = 0; i < 24; i++) {
      try {
        await createReading({
          lineId: activeLineId,
          pH: randomBetween(6.2, 8.8),
          turbidity: randomBetween(0.5, 5.0),
          conductivity: randomBetween(80, 850),
        })
        created++
        setSeedCount(created)
      } catch {
        // skip failed request, continue loop
      }
    }
    qc.invalidateQueries()
    setSeeding(false)
  }
  //  this is comment
  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {lines?.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLine(l.id)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                activeLineId === l.id
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : dark
                    ? 'border-slate-700 text-slate-400 hover:border-slate-500'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={seedDemoData}
            disabled={seeding}
            className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 rounded-full text-sm font-medium transition-all disabled:opacity-50"
          >
            {seeding ? `⏳ Seeding… ${seedCount}/24` : '⚡ Generate Demo Data'}
          </button>
          <button
            onClick={onOpenIncident}
            className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded-full text-sm font-medium transition-all"
          >
            ⚠ Log Incident
          </button>
          <button
            onClick={onOpenThreshold}
            className="px-4 py-1.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600 text-slate-300 rounded-full text-sm font-medium transition-all"
          >
            ⚙ Thresholds
          </button>
        </div>
      </div>

      {/* Line status cards */}
      <section>
        <h2 className={clsx('text-sm font-semibold uppercase tracking-wider mb-3', dark ? 'text-slate-500' : 'text-slate-400')}>
          Line Status
        </h2>
        <LineStatusGrid dark={dark} />
      </section>

      {/* Chart + Drift */}
      <div className="flex flex-col gap-6">
        <div >
          {activeLineId && <QualityChart key={activeLineId} lineId={activeLineId} dark={dark} />}
        </div>
        <div>
          <SensorDrift dark={dark} />
        </div>
      </div>
    </div>
  )
}
