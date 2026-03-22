# FootballGenius Assistant

Minimaler Next.js Assistant mit Groq (llama-3.1-70b-versatile).

## Setup lokal
1. `.env.local` anlegen (nicht committen):
   - `GROQ_API_KEY=...`
   - optional `GROQ_MODEL=llama-3.1-70b-versatile`
   - optional `ZEROBASTI=embark-object-face`
2. Install & Start:
   - `npm i`
   - `npm run dev`

## API

- Streaming: POST /api/stream (text/plain stream)
- `POST /api` → Body: `{ messages: [{ role:'user'|'assistant', content: string }] }`
- `GET /api/health` → `{ ok, groq, model, version, ts }`

## Vercel
- Root Directory: `assistant`
- Install: `npm i`, Build: `npm run build`, Output: `.next`, Node: `20`
- Env: `GROQ_API_KEY` (Pflicht), optional `GROQ_MODEL`, `ZEROBASTI`
- Region: FRA1

## Hinweise
- Kein Key im Client. Fehler werden im UI angezeigt.
