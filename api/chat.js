// POST /api/chat
// Body: { messages: [{role, content}], context: visitNotes[] }
// Requires env var: GROQ_API_KEY (from console.groq.com)
// Uses Groq's OpenAI-compatible endpoint at https://api.groq.com/openai/v1/chat/completions

const SYSTEM_PROMPT = `You are the CareOS Suite assistant, embedded in a home care
rostering and compliance app. You help care managers and carers by reading
recent visit notes and answering questions about clients, gaps in visit
coverage, and drafting shift handovers. Be concise and practical — this is
a working tool for busy care staff, not a chat companion. Never invent
clinical facts that aren't in the provided visit notes; if you don't have
enough information, say so and suggest what to check.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set on the server.' })
  }

  const { messages = [], context = [] } = req.body || {}

  const contextBlock = context.length
    ? 'Recent visit notes:\n' +
      context
        .map((n) => `- [${n.clients?.name || 'Client'} · ${new Date(n.created_at).toLocaleDateString()}] ${n.note}`)
        .join('\n')
    : 'No recent visit notes are available.'

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: contextBlock },
          ...messages,
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `Groq API error: ${text}` })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No response from the assistant.'
    res.status(200).json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}