# FootballGenius Assistant

Minimaler Next.js Assistant mit Groq (llama-3.1-70b-versatile).

## Setup
1. `.env.local` (nicht committen):
   - `GROQ_API_KEY=...`
   - `GROQ_MODEL=llama-3.1-70b-versatile`
   - optional: `ZEROBASTI=embark-object-face`
2. Lokal:
   - `npm i`
   - `npm run dev`
3. Vercel:
   - Project → Settings → Environment Variables setzen (wie oben)
   - Deploy

## Hinweise
- API-Key niemals clientseitig nutzen.
- Bei Leaks Key in Groq Console rotieren.
