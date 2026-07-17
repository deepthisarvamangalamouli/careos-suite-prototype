import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const STARTERS = [
  'Summarise this week\u2019s visit notes for Margaret O.',
  'Which clients have no visit logged in the last 3 days?',
  'Draft a handover note for the evening shift.',
]

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi — I can read your team\u2019s visit notes and care plans. Ask me to summarise, flag gaps, or draft a handover.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    // Pull recent visit notes as lightweight context for the assistant.
    const { data: notes } = await supabase
      .from('visit_notes')
      .select('note, created_at, clients(name)')
      .order('created_at', { ascending: false })
      .limit(15)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          context: notes || [],
        }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || data.error || 'No response.' }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'The assistant isn\u2019t reachable right now: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--pine)' }}>AI Assistant</p>
        <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Ask about the round</h1>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl p-5 space-y-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={
                m.role === 'user'
                  ? { background: 'var(--ink)', color: 'white' }
                  : { background: 'var(--stone)', color: 'var(--ink)' }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <Sparkles size={14} className="animate-pulse" /> Reading recent visit notes…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'var(--stone)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send() }}
        className="flex gap-2 mt-4"
      >
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
          style={{ border: '1px solid var(--line)', background: 'var(--panel)' }}
        />
        <button type="submit" disabled={loading}
          className="px-4 rounded-lg text-white disabled:opacity-60" style={{ background: 'var(--pine)' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
