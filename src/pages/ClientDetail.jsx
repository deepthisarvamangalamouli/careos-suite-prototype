import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [plan, setPlan] = useState({ goals: '', needs: '', risks: '', emergency_contact_name: '', emergency_contact_phone: '' })
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: c } = await supabase.from('clients').select('*').eq('id', id).single()
    setClient(c)
    const { data: p } = await supabase.from('care_plans').select('*').eq('client_id', id).maybeSingle()
    if (p) setPlan(p)
    const { data: n } = await supabase
      .from('visit_notes')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
    setNotes(n || [])
  }

  useEffect(() => { load() }, [id])

  async function savePlan(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('care_plans').upsert({ client_id: id, ...plan }, { onConflict: 'client_id' })
    setSaving(false)
  }

  async function addNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    await supabase.from('visit_notes').insert({ client_id: id, note: newNote })
    setNewNote('')
    load()
  }

  if (!client) return <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>

  return (
    <div>
      <Link to="/app/clients" className="text-xs font-medium" style={{ color: 'var(--pine-dark)' }}>← All clients</Link>
      <h1 className="font-display text-3xl mt-3 mb-8" style={{ color: 'var(--ink)' }}>{client.name}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={savePlan} className="rounded-xl p-5 space-y-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <h2 className="font-display text-lg" style={{ color: 'var(--ink)' }}>Care plan</h2>
          <Field label="Goals" value={plan.goals} onChange={(v) => setPlan({ ...plan, goals: v })} />
          <Field label="Support needs" value={plan.needs} onChange={(v) => setPlan({ ...plan, needs: v })} />
          <Field label="Risks & precautions" value={plan.risks} onChange={(v) => setPlan({ ...plan, risks: v })} />
          <TextField label="Emergency contact name" value={plan.emergency_contact_name} onChange={(v) => setPlan({ ...plan, emergency_contact_name: v })} />
          <TextField label="Emergency contact phone" type="tel" value={plan.emergency_contact_phone} onChange={(v) => setPlan({ ...plan, emergency_contact_phone: v })} />
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--pine)' }}>
            {saving ? 'Saving…' : 'Save care plan'}
          </button>
        </form>

        <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--ink)' }}>Visit notes</h2>
          <form onSubmit={addNote} className="flex gap-2 mb-5">
            <input
              value={newNote} onChange={(e) => setNewNote(e.target.value)}
              placeholder="Log today's visit…"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }}
            />
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--ink)' }}>
              Log
            </button>
          </form>
          {notes.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No visit notes yet.</p>}
          <div className="visit-thread space-y-4">
            {notes.map((n) => (
              <div key={n.id} className="visit-node" data-state="done">
                <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <textarea
        rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid var(--line)' }}
      />
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <input
        type={type} value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }}
      />
    </div>
  )
}
