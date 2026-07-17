import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [careNeed, setCareNeed] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('clients').insert({ name, care_need: careNeed })
    setName('')
    setCareNeed('')
    setShowForm(false)
    setSaving(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Care planning</p>
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Clients</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--pine)' }}
        >
          <Plus size={16} /> Add client
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl p-5 mb-6 grid md:grid-cols-3 gap-3 items-end" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Primary care need</label>
            <input value={careNeed} onChange={(e) => setCareNeed(e.target.value)} placeholder="e.g. Mobility support"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--ink)' }}>
            {saving ? 'Saving…' : 'Save client'}
          </button>
        </form>
      )}

      {loading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>}
      {!loading && clients.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No clients yet — add your first one above.</p>
      )}

      <div className="grid gap-3">
        {clients.map((c) => (
          <Link
            key={c.id}
            to={`/app/clients/${c.id}`}
            className="flex items-center justify-between rounded-xl p-4 hover:shadow-sm transition-shadow"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{c.care_need || 'General care'}</p>
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>View plan →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
