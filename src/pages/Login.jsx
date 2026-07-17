import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/app')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--stone)' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--pine)' }}>
            <span className="font-mono text-xs text-white">CO</span>
          </div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Sign in to your care team</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid var(--line)' }}
              placeholder="you@agency.co.uk"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid var(--line)' }}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--flag)' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--pine)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--muted)' }}>
          New here? <Link to="/signup" className="font-medium" style={{ color: 'var(--pine-dark)' }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
