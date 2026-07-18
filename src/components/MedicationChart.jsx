import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const STATUS_CYCLE = [null, 'given', 'missed', 'refused']
const STATUS_STYLE = {
  given: { bg: 'var(--pine)', fg: 'white', label: 'G' },
  missed: { bg: 'var(--flag)', fg: 'white', label: 'M' },
  refused: { bg: '#C98A3E', fg: 'white', label: 'R' },
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function MedicationChart({ clientId }) {
  const [meds, setMeds] = useState([])
  const [logs, setLogs] = useState({}) // `${medId}:${date}` -> status
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '' })
  const days = lastNDays(7)

  async function load() {
    const { data: m } = await supabase
      .from('medications')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('created_at')
    setMeds(m || [])

    if (m && m.length) {
      const { data: l } = await supabase
        .from('medication_logs')
        .select('*')
        .in('medication_id', m.map((x) => x.id))
        .gte('log_date', days[0])
      const map = {}
      ;(l || []).forEach((row) => {
        map[`${row.medication_id}:${row.log_date}`] = row.status
      })
      setLogs(map)
    }
  }

  useEffect(() => { load() }, [clientId])

  async function addMed(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    await supabase.from('medications').insert({ client_id: clientId, ...form })
    setForm({ name: '', dosage: '', frequency: '' })
    setShowForm(false)
    load()
  }

  async function cycleStatus(medId, date) {
    const key = `${medId}:${date}`
    const current = logs[key] || null
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    if (next === null) {
      await supabase.from('medication_logs').delete().eq('medication_id', medId).eq('log_date', date)
    } else {
      await supabase
        .from('medication_logs')
        .upsert({ medication_id: medId, log_date: date, status: next }, { onConflict: 'medication_id,log_date' })
    }
    load()
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg" style={{ color: 'var(--ink)' }}>Medication chart (MAR)</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Click a day's cell to log given / missed / refused</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--pine)' }}
        >
          <Plus size={15} /> Add medication
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMed} className="grid md:grid-cols-4 gap-3 items-end mb-5 p-4 rounded-lg" style={{ background: 'var(--stone)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Medication</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paracetamol"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Dosage</label>
            <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              placeholder="e.g. 500mg"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Frequency</label>
            <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              placeholder="e.g. Twice daily"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--ink)' }}>
            Save
          </button>
        </form>
      )}

      {meds.length === 0 && !showForm && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No medications on record yet.</p>
      )}

      {meds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3" style={{ color: 'var(--muted)' }}>Medication</th>
                {days.map((d) => (
                  <th key={d} className="text-center px-1 py-2 font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                    {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                    <br />{d.slice(8, 10)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td className="py-2 pr-3">
                    <p className="font-medium" style={{ color: 'var(--ink)' }}>{m.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</p>
                  </td>
                  {days.map((d) => {
                    const status = logs[`${m.id}:${d}`]
                    const style = STATUS_STYLE[status]
                    return (
                      <td key={d} className="text-center px-1 py-2">
                        <button
                          onClick={() => cycleStatus(m.id, d)}
                          className="w-7 h-7 rounded-md text-[11px] font-mono font-medium"
                          style={{
                            background: style ? style.bg : 'transparent',
                            color: style ? style.fg : 'var(--muted)',
                            border: style ? 'none' : '1px dashed var(--line)',
                          }}
                          title={status || 'Not logged — click to mark given'}
                        >
                          {style ? style.label : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            <Legend color="var(--pine)" label="Given" />
            <Legend color="var(--flag)" label="Missed" />
            <Legend color="#C98A3E" label="Refused" />
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded" style={{ background: color }} /> {label}
    </span>
  )
}
