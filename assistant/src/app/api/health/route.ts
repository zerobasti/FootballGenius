import { NextResponse } from 'next/server'
import pkg from '../../../../package.json'
export const runtime = 'nodejs'
export async function GET() {
  return NextResponse.json({
    ok: true,
    groq: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    version: (pkg as any)?.version || '0.1.0',
    ts: new Date().toISOString(),
  })
}
