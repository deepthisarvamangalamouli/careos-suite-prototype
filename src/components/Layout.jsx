import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarClock, ShieldCheck, CreditCard, Sparkles, LogOut } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/clients', label: 'Care Planning', icon: Users },
  { to: '/app/rostering', label: 'Rostering', icon: CalendarClock },
  { to: '/app/compliance', label: 'Compliance', icon: ShieldCheck },
  { to: '/app/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
]

export default function Layout() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--stone)' }}>
      <aside
        className="w-64 shrink-0 flex flex-col justify-between border-r px-5 py-6"
        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-10 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--pine)' }}
            >
              <span className="font-mono text-[11px] text-white">CO</span>
            </div>
            <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>
              CareOS Suite
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'font-medium' : 'hover:bg-[#F5F7F6]'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--pine-dark)' : 'var(--muted)',
                  background: isActive ? '#EAF2EF' : 'transparent',
                })}
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="px-3 py-3 mb-2 rounded-lg" style={{ background: 'var(--stone)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Signed in as</p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--pine)' }}>
              {profile?.role || 'carer'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg w-full hover:bg-[#F5F7F6]"
            style={{ color: 'var(--muted)' }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}
