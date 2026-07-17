import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import StatusPill from '../components/StatusPill'

const PLANS = [
  { key: 'starter', name: 'Starter', price: '£29/mo', seats: 'Up to 5 carers', priceEnvVar: 'starter' },
  { key: 'growth', name: 'Growth', price: '£79/mo', seats: 'Up to 20 carers', priceEnvVar: 'growth', highlight: true },
  { key: 'agency', name: 'Agency', price: '£199/mo', seats: 'Unlimited carers', priceEnvVar: 'agency' },
]

export default function Billing() {
  const { user } = useAuth()
  const [account, setAccount] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(null)

  useEffect(() => {
    supabase.from('billing_accounts').select('*').limit(1).maybeSingle().then(({ data }) => setAccount(data))
  }, [])

  async function startCheckout(plan) {
    setLoadingPlan(plan.key)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.key, email: user?.email, userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Could not start checkout — check Stripe env vars are set.')
    } catch (err) {
      alert('Checkout is not wired up in this environment yet: ' + err.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  async function openPortal() {
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: account?.stripe_customer_id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error || 'No billing portal session — subscribe first.')
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>Billing</p>
      <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>Plan & subscription</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Prototype billing via Stripe Checkout — subscription status syncs back through a webhook.
      </p>

      {account?.status && (
        <div className="rounded-xl p-4 mb-8 flex items-center justify-between" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Current plan: {account.plan || '—'}</p>
            <StatusPill tone={account.status === 'active' ? 'ok' : 'warn'}>{account.status}</StatusPill>
          </div>
          <button onClick={openPortal} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
            Manage billing
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className="rounded-xl p-6 flex flex-col"
            style={{
              background: 'var(--panel)',
              border: p.highlight ? '2px solid var(--pine)' : '1px solid var(--line)',
            }}
          >
            {p.highlight && <StatusPill tone="ok">Most popular</StatusPill>}
            <h3 className="font-display text-xl mt-3" style={{ color: 'var(--ink)' }}>{p.name}</h3>
            <p className="font-display text-3xl my-3" style={{ color: 'var(--ink)' }}>{p.price}</p>
            <p className="text-xs mb-5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
              <Check size={14} style={{ color: 'var(--pine)' }} /> {p.seats}
            </p>
            <button
              onClick={() => startCheckout(p)}
              disabled={loadingPlan === p.key}
              className="mt-auto py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{
                background: p.highlight ? 'var(--pine)' : 'var(--stone)',
                color: p.highlight ? 'white' : 'var(--ink)',
                border: p.highlight ? 'none' : '1px solid var(--line)',
              }}
            >
              {loadingPlan === p.key ? 'Redirecting…' : 'Choose plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
