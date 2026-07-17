const TONES = {
  ok: { bg: '#EAF2EF', fg: 'var(--pine-dark)' },
  warn: { bg: '#FBF1E4', fg: '#8A5A1E' },
  flag: { bg: '#FBEAE6', fg: 'var(--flag)' },
  neutral: { bg: '#EEF0EF', fg: 'var(--muted)' },
}

export default function StatusPill({ tone = 'neutral', children }) {
  const t = TONES[tone] || TONES.neutral
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  )
}
