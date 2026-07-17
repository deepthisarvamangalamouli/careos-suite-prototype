import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('carer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) {
      setLoading(false)
      return setError(error.message)
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role,
      })
    }
    setLoading(false)
    navigate('/app')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--stone)' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--pine)' }}>
            <span className="font-mono text-xs text-white">CO</span>
          </div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Set up care planning, in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--line)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
            <div className="flex gap-2">
              {['carer', 'manager'].map((r) => (
                <button
                  type="button" key={r} onClick={() => setRole(r)}
                  className="flex-1 py-2 rounded-lg text-sm capitalize border"
                  style={{
                    borderColor: role === r ? 'var(--pine)' : 'var(--line)',
                    background: role === r ? '#EAF2EF' : 'transparent',
                    color: role === r ? 'var(--pine-dark)' : 'var(--muted)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--flag)' }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--pine)' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--muted)' }}>
          Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--pine-dark)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
