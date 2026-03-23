import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  return NextResponse.json({
    prediction: "Team A gewinnt",
    confidence: 0.62,
    input: body,
  });
}
