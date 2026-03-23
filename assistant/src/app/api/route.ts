import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const system = `Du bist der FootballGenius Assistant. Antworte knapp, präzise, fußballfokussiert.
- Wenn möglich, nutze Taktik-/Stats-Vokabular (xG, PPDA, Pressinghöhen, Box-Entries).
- Sei ehrlich über Unsicherheiten. Keine Halluzinationen.
- Output auf Deutsch.`;

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    const chat = [
      { role: "system", content: system },
      ...messages,
    ] as any;

    const resp = await client.chat.completions.create({
      model,
      messages: chat,
      temperature: 0.2,
      stream: false,
    });

    const reply = resp.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error?.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}