import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import StatusPill from '../components/StatusPill'

const STATUS_TONE = { scheduled: 'neutral', completed: 'ok', missed: 'flag' }

export default function Rostering() {
  const [shifts, setShifts] = useState([])
  const [clients, setClients] = useState([])
  const [carers, setCarers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ client_id: '', carer_id: '', shift_date: '', start_time: '09:00', end_time: '10:00' })

  async function load() {
    const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('shifts').select('*, clients(name)').order('shift_date', { ascending: true }),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'carer'),
    ])
    setShifts(s || [])
    setClients(c || [])
    setCarers(p || [])
  }

  useEffect(() => { load() }, [])

  async function addShift(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('shifts').insert({
      client_id: form.client_id || null,
      carer_id: form.carer_id || null,
      shift_date: form.shift_date,
      start_time: form.start_time,
      end_time: form.end_time,
    })
    setForm({ client_id: '', carer_id: '', shift_date: '', start_time: '09:00', end_time: '10:00' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function setStatus(id, status) {
    await supabase.from('shifts').update({ status }).eq('id', id)
    load()
  }

  const byDate = shifts.reduce((acc, s) => {
    (acc[s.shift_date] ??= []).push(s)
    return acc
  }, {})

  function carerName(id) {
    return carers.find((c) => c.id === id)?.full_name || 'Unassigned'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Rostering</p>
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>The round</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--pine)' }}
        >
          <Plus size={16} /> Schedule shift
        </button>
      </div>

      {showForm && (
        <form onSubmit={addShift} className="rounded-xl p-5 mb-6 grid md:grid-cols-5 gap-3 items-end" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <Select label="Client" value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })}
            options={clients.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Carer" value={form.carer_id} onChange={(v) => setForm({ ...form, carer_id: v })}
            options={carers.map((c) => ({ value: c.id, label: c.full_name || 'Unnamed' }))} />
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Date</label>
            <input type="date" required value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Start</label>
            <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>End</label>
            <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <button type="submit" disabled={saving} className="md:col-span-5 justify-self-start px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--ink)' }}>
            {saving ? 'Saving…' : 'Save shift'}
          </button>
        </form>
      )}

      {Object.keys(byDate).length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No shifts scheduled yet — add one above.</p>
      )}

      <div className="space-y-8">
        {Object.entries(byDate).map(([date, dayShifts]) => (
          <div key={date}>
            <p className="font-mono text-xs mb-3" style={{ color: 'var(--muted)' }}>
              {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="visit-thread space-y-4">
              {dayShifts.map((s) => (
                <div key={s.id} className="visit-node" data-state={s.status === 'missed' ? 'flag' : s.status === 'completed' ? 'done' : 'todo'}>
                  <div className="flex items-center justify-between rounded-xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)} · {s.clients?.name || 'No client'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{carerName(s.carer_id)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={STATUS_TONE[s.status]}>{s.status}</StatusPill>
                      {s.status === 'scheduled' && (
                        <>
                          <button onClick={() => setStatus(s.id, 'completed')} className="text-xs font-medium" style={{ color: 'var(--pine-dark)' }}>Mark done</button>
                          <button onClick={() => setStatus(s.id, 'missed')} className="text-xs font-medium" style={{ color: 'var(--flag)' }}>Mark missed</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white" style={{ border: '1px solid var(--line)' }}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
