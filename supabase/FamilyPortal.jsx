import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function FamilyPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: result, error: err } = await supabase.rpc('get_family_portal', { p_token: token })
      if (err) setError(err.message)
      else if (!result) setError('This link is not valid — please check with the care office.')
      else setData(result)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return <Centered><p style={{ color: 'var(--muted)' }}>Loading…</p></Centered>
  if (error) return <Centered><p style={{ color: 'var(--flag)' }}>{error}</p></Centered>

  const { client, care_plan: plan, visit_notes: notes } = data

  return (
    <div style={{ background: 'var(--stone)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--pine)' }}>
            <span className="font-mono text-[10px] text-white">CO</span>
          </div>
          <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>CareOS Suite — Family view</span>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Read-only summary</p>
        <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--ink)' }}>{client.name}</h1>
        {client.care_need && <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>{client.care_need}</p>}

        <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--ink)' }}>Care plan</h2>
          <PlanField label="Goals" value={plan?.goals} />
          <PlanField label="Support needs" value={plan?.needs} />
          <PlanField label="Risks & precautions" value={plan?.risks} />
        </div>

        <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--ink)' }}>Recent visits</h2>
          {(!notes || notes.length === 0) && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No visits logged yet.</p>
          )}
          <div className="visit-thread space-y-4">
            {(notes || []).map((n, i) => (
              <div key={i} className="visit-node" data-state="done">
                <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>{n.note}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--muted)' }}>
          This is a shared, read-only view — for questions, please contact the care office directly.
        </p>
      </div>
    </div>
  )
}

function PlanField({ label, value }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>{value || '—'}</p>
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--stone)' }}>
      {children}
    </div>
  )
}
