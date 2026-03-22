'use client'
import { useState, useRef } from 'react'

type Msg = { role: 'user'|'assistant'; content: string }

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function send() {
    if (loading) return
    const text = input.trim()
    if (!text) return
    setError(null)
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next); setInput(''); setLoading(true)
    try {
      // create placeholder assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      const res = await fetch('/api/stream', { method: 'POST', body: JSON.stringify({ messages: next }) })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Fehler in /api/stream')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let acc = ''
      while (!done) {
        const r = await reader.read()
        done = r.done || false
        const chunk = decoder.decode(r.value || new Uint8Array(), { stream: true })
        if (chunk) {
          acc += chunk
          setMessages(prev => {
            const copy = prev.slice()
            copy[copy.length - 1] = { role: 'assistant', content: acc }
            return copy
          })
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function reset() {
    setMessages([])
    setError(null)
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>FootballGenius Assistant</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ background: m.role==='user'?'#eef':'#efe', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
        {error && <div style={{ background:'#fee', color:'#900', padding:12, borderRadius:8 }}>
          <b>Fehler:</b> {error}
        </div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown}
               disabled={loading} style={{ flex:1, padding:10 }} placeholder="Frage zu Taktik, Stats…" />
        <button onClick={send} disabled={loading}>{loading ? 'Senden…' : 'Senden'}</button>
        <button onClick={reset} disabled={loading}>Reset</button>
      </div>
    </main>
  )
}
