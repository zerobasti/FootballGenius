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
    const completion = await client.chat.completions.create({ model, messages: chat, temperature: 0.2, stream: true })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of completion as any) {
            const delta = part?.choices?.[0]?.delta?.content || ''
            if (delta) controller.enqueue(encoder.encode(delta))
          }
        } catch (e) {
          controller.error(e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'internal error' }, { status: 500 })
  }
}
