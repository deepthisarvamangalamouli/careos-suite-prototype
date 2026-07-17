import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const ROUND = [
  { time: '08:00', label: 'Morning medication round', state: 'done' },
  { time: '11:30', label: 'Mobility check-in', state: 'done' },
  { time: '14:00', label: 'Care plan review due', state: 'flag' },
  { time: '18:00', label: 'Evening visit', state: 'pending' },
]

export default function Landing() {
  return (
    <div style={{ background: 'var(--stone)', minHeight: '100vh' }}>
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--pine)' }}>
            <span className="font-mono text-[10px] text-white">CO</span>
          </div>
          <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>CareOS Suite</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/login" style={{ color: 'var(--muted)' }}>Sign in</Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ background: 'var(--pine)' }}
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-8 pt-14 pb-20 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--pine)' }}>
            Care planning · Rostering · Compliance · Billing · AI assistant
          </p>
          <h1 className="font-display text-5xl leading-[1.08] mb-6" style={{ color: 'var(--ink)' }}>
            One thread, from
            <br />
            care plan to invoice.
          </h1>
          <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: 'var(--muted)' }}>
            CareOS Suite keeps a client's care plan, the roster, training
            compliance, and billing on the same timeline — with an AI
            assistant that reads the round so your team doesn't have to.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-white font-medium text-sm"
            style={{ background: 'var(--ink)' }}
          >
            Start a free prototype workspace <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl p-7" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <p className="text-xs font-medium mb-5" style={{ color: 'var(--muted)' }}>Today's round — Margaret O.</p>
          <div className="visit-thread space-y-5">
            {ROUND.map((r) => (
              <div key={r.label} className="visit-node" data-state={r.state === 'pending' ? 'todo' : r.state}>
                <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{r.time}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { t: 'Care Planning', d: 'Client goals, needs, and visit notes on one continuous record — not a form nobody reopens.' },
          { t: 'Rostering', d: 'Schedule shifts by carer and client, and track which visits happened, day by day.' },
          { t: 'Compliance', d: 'Training and certifications with expiry dates, flagged automatically before they lapse.' },
          { t: 'AI Assistant', d: 'Ask the assistant to summarise a client\u2019s last few visits, or flag anything that looks missed.' },
          { t: 'Billing', d: 'Stripe-backed subscriptions by seat, with a self-serve portal for managers to manage their plan.' },
        ].map((f) => (
          <div key={f.t} className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <h3 className="font-display text-lg mb-2" style={{ color: 'var(--ink)' }}>{f.t}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
