'use client'
import { useState } from 'react'

export default function Page() {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    const next = [...messages, { role: 'user', content: input }]
    setMessages(next)
    setInput('')
    const res = await fetch('/api', { method: 'POST', body: JSON.stringify({ messages: next }) })
    const data = await res.json()
    setMessages([...next, { role: 'assistant', content: data.content }])
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>FootballGenius Assistant</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ background: m.role==='user'?'#eef':'#efe', padding: 12, borderRadius: 8 }}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} style={{ flex: 1, padding: 10 }} placeholder="Frage zu Taktik, Stats…" />
        <button onClick={send}>Senden</button>
      </div>
    </main>
  )
}
