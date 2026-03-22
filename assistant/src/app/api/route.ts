import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'

const system = `Du bist der FootballGenius Assistant. Antworte knapp, präzise, fußballfokussiert.
- Nutze Taktik-/Stats-Vokabular (xG, PPDA, Pressinghöhe, Box-Entries), wenn passend.
- Sei ehrlich über Unsicherheiten. Keine Halluzinationen.
- Output: Deutsch.`

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({})) as any
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (!messages.length) {
      return NextResponse.json({ error: 'messages[] required' }, { status: 400 })
    }
    const chat = [{ role: 'system', content: system }, ...messages] as any
    const resp = await client.chat.completions.create({ model, messages: chat, temperature: 0.2, stream: false })
    const content = resp.choices?.[0]?.message?.content ?? ''
    return new NextResponse(JSON.stringify({ content }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      status: 200,
    })
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
