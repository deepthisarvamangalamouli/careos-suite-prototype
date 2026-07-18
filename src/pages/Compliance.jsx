import { useEffect, useState } from 'react'
import { Plus, ShieldAlert, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import StatusPill from '../components/StatusPill'

const INCIDENT_TYPES = ['Fall', 'Medication error', 'Behavioural', 'Property damage', 'Missed visit', 'Other']
const SEVERITY_TONE = { minor: 'neutral', moderate: 'warn', serious: 'flag' }

function expiryStatus(expiry_date) {
  if (!expiry_date) return { tone: 'neutral', label: 'No expiry set' }
  const days = Math.ceil((new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { tone: 'flag', label: 'Expired' }
  if (days <= 60) return { tone: 'warn', label: `Expires in ${days}d` }
  return { tone: 'ok', label: 'Valid' }
}

export default function Compliance() {
  const [records, setRecords] = useState([])
  const [carers, setCarers] = useState([])
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ carer_id: '', training_name: '', completed_date: '', expiry_date: '' })

  const [incidents, setIncidents] = useState([])
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [savingIncident, setSavingIncident] = useState(false)
  const [incidentForm, setIncidentForm] = useState({
    client_id: '', incident_type: INCIDENT_TYPES[0], severity: 'minor', description: '', follow_up_needed: false,
  })

  async function load() {
    const [{ data: r }, { data: p }, { data: cl }, { data: inc }] = await Promise.all([
      supabase.from('carer_training').select('*, profiles(full_name)').order('expiry_date', { ascending: true }),
      supabase.from('profiles').select('id, full_name').eq('role', 'carer'),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('incidents').select('*, clients(name)').order('occurred_at', { ascending: false }),
    ])
    setRecords(r || [])
    setCarers(p || [])
    setClients(cl || [])
    setIncidents(inc || [])
  }

  useEffect(() => { load() }, [])

  async function addRecord(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('carer_training').insert({
      carer_id: form.carer_id,
      training_name: form.training_name,
      completed_date: form.completed_date || null,
      expiry_date: form.expiry_date || null,
    })
    setForm({ carer_id: '', training_name: '', completed_date: '', expiry_date: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function addIncident(e) {
    e.preventDefault()
    if (!incidentForm.description.trim()) return
    setSavingIncident(true)
    await supabase.from('incidents').insert({
      client_id: incidentForm.client_id || null,
      incident_type: incidentForm.incident_type,
      severity: incidentForm.severity,
      description: incidentForm.description,
      follow_up_needed: incidentForm.follow_up_needed,
    })
    setIncidentForm({ client_id: '', incident_type: INCIDENT_TYPES[0], severity: 'minor', description: '', follow_up_needed: false })
    setShowIncidentForm(false)
    setSavingIncident(false)
    load()
  }

  const flagged = records.filter((r) => expiryStatus(r.expiry_date).tone !== 'ok')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Compliance</p>
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Training & certifications</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--pine)' }}
        >
          <Plus size={16} /> Log training
        </button>
      </div>

      {flagged.length > 0 && (
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: '#FBEAE6', border: '1px solid #F0C7BC' }}>
          <ShieldAlert size={18} style={{ color: 'var(--flag)' }} className="mt-0.5 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            {flagged.length} record{flagged.length === 1 ? '' : 's'} need attention — expired or expiring within 60 days.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={addRecord} className="rounded-xl p-5 mb-6 grid md:grid-cols-4 gap-3 items-end" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Carer</label>
            <select required value={form.carer_id} onChange={(e) => setForm({ ...form, carer_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white" style={{ border: '1px solid var(--line)' }}>
              <option value="">Select…</option>
              {carers.map((c) => <option key={c.id} value={c.id}>{c.full_name || 'Unnamed'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Training / certification</label>
            <input required value={form.training_name} onChange={(e) => setForm({ ...form, training_name: e.target.value })}
              placeholder="e.g. Manual handling"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Completed</label>
            <input type="date" value={form.completed_date} onChange={(e) => setForm({ ...form, completed_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Expires</label>
            <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <button type="submit" disabled={saving} className="md:col-span-4 justify-self-start px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--ink)' }}>
            {saving ? 'Saving…' : 'Save record'}
          </button>
        </form>
      )}

      {records.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No training records yet — log one above.</p>
      )}

      <div className="grid gap-3">
        {records.map((r) => {
          const status = expiryStatus(r.expiry_date)
          return (
            <div key={r.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{r.training_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {r.profiles?.full_name || 'Unnamed carer'}
                  {r.expiry_date ? ` · expires ${new Date(r.expiry_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
          )
        })}
      </div>

      {/* Incident reporting */}
      <div className="flex items-center justify-between mt-12 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Compliance</p>
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Incident reports</h1>
        </div>
        <button
          onClick={() => setShowIncidentForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--pine)' }}
        >
          <Plus size={16} /> Log incident
        </button>
      </div>

      {incidents.some((i) => i.follow_up_needed) && (
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: '#FBEAE6', border: '1px solid #F0C7BC' }}>
          <AlertTriangle size={18} style={{ color: 'var(--flag)' }} className="mt-0.5 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            {incidents.filter((i) => i.follow_up_needed).length} incident{incidents.filter((i) => i.follow_up_needed).length === 1 ? '' : 's'} still need follow-up.
          </p>
        </div>
      )}

      {showIncidentForm && (
        <form onSubmit={addIncident} className="rounded-xl p-5 mb-6 space-y-3" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Client</label>
              <select value={incidentForm.client_id} onChange={(e) => setIncidentForm({ ...incidentForm, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white" style={{ border: '1px solid var(--line)' }}>
                <option value="">Select…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Type</label>
              <select value={incidentForm.incident_type} onChange={(e) => setIncidentForm({ ...incidentForm, incident_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white" style={{ border: '1px solid var(--line)' }}>
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Severity</label>
              <div className="flex gap-2">
                {['minor', 'moderate', 'serious'].map((s) => (
                  <button type="button" key={s} onClick={() => setIncidentForm({ ...incidentForm, severity: s })}
                    className="flex-1 py-2 rounded-lg text-xs capitalize border"
                    style={{
                      borderColor: incidentForm.severity === s ? 'var(--pine)' : 'var(--line)',
                      background: incidentForm.severity === s ? '#EAF2EF' : 'transparent',
                      color: incidentForm.severity === s ? 'var(--pine-dark)' : 'var(--muted)',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>What happened</label>
            <textarea required rows={3} value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
            <input type="checkbox" checked={incidentForm.follow_up_needed}
              onChange={(e) => setIncidentForm({ ...incidentForm, follow_up_needed: e.target.checked })} />
            This needs office follow-up
          </label>
          <button type="submit" disabled={savingIncident}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--ink)' }}>
            {savingIncident ? 'Saving…' : 'Save incident report'}
          </button>
        </form>
      )}

      {incidents.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No incidents logged yet.</p>
      )}

      <div className="grid gap-3">
        {incidents.map((i) => (
          <div key={i.id} className="rounded-xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {i.incident_type}{i.clients?.name ? ` · ${i.clients.name}` : ''}
              </p>
              <div className="flex items-center gap-2">
                {i.follow_up_needed && <StatusPill tone="flag">Follow-up needed</StatusPill>}
                <StatusPill tone={SEVERITY_TONE[i.severity]}>{i.severity}</StatusPill>
              </div>
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{new Date(i.occurred_at).toLocaleString()}</p>
            <p className="text-sm" style={{ color: 'var(--ink)' }}>{i.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
