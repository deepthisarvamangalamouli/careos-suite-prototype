import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import StatusPill from '../components/StatusPill'

export default function Dashboard() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [notes, setNotes] = useState([])
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)

  const [todayShifts, setTodayShifts] = useState(0)
  const [complianceFlags, setComplianceFlags] = useState(0)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const [{ data: c }, { data: n }, { data: b }, { count: shiftCount }, { count: flagCount }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('visit_notes').select('*, clients(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('billing_accounts').select('*').limit(1).maybeSingle(),
        supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('shift_date', today),
        supabase.from('carer_training').select('*', { count: 'exact', head: true }).lte('expiry_date', in60),
      ])
      setClients(c || [])
      setNotes(n || [])
      setBilling(b || null)
      setTodayShifts(shiftCount || 0)
      setComplianceFlags(flagCount || 0)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Overview</p>
      <h1 className="font-display text-3xl mb-8" style={{ color: 'var(--ink)' }}>
        Good to see you, {profile?.full_name?.split(' ')[0] || 'there'}.
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard label="Active clients" value={clients.length} />
        <StatCard label="Visit notes logged" value={notes.length} />
        <StatCard label="Shifts today" value={todayShifts} />
        <StatCard
          label="Compliance flags"
          value={complianceFlags}
          accent={complianceFlags > 0 ? 'flag' : 'ok'}
        />
        <StatCard
          label="Billing status"
          value={billing?.status ? billing.status : 'No plan yet'}
          accent={billing?.status === 'active' ? 'ok' : 'warn'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--ink)' }}>Recent clients</h2>
            <Link to="/app/clients" className="text-xs font-medium" style={{ color: 'var(--pine-dark)' }}>View all</Link>
          </div>
          {loading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>}
          {!loading && clients.length === 0 && (
            <EmptyState text="No clients yet." cta="Add your first client" to="/app/clients" />
          )}
          <div className="visit-thread space-y-4">
            {clients.map((c) => (
              <div key={c.id} className="visit-node" data-state="done">
                <Link to={`/app/clients/${c.id}`} className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {c.name}
                </Link>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{c.care_need || 'General care'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--ink)' }}>Latest visit notes</h2>
          {!loading && notes.length === 0 && (
            <EmptyState text="No visit notes logged yet." cta="Log a visit" to="/app/clients" />
          )}
          <div className="visit-thread space-y-4">
            {notes.map((n) => (
              <div key={n.id} className="visit-node" data-state="done">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{n.clients?.name || 'Client'}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{label}</p>
      {accent ? (
        <StatusPill tone={accent}>{value}</StatusPill>
      ) : (
        <p className="font-display text-2xl" style={{ color: 'var(--ink)' }}>{value}</p>
      )}
    </div>
  )
}

function EmptyState({ text, cta, to }) {
  return (
    <div className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
      {text}{' '}
      <Link to={to} className="font-medium" style={{ color: 'var(--pine-dark)' }}>{cta} →</Link>
    </div>
  )
}
