import { getMatches } from "../../../lib/football-data";

export const runtime = "nodejs";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIsoDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const dateFrom = searchParams.get("dateFrom") || todayIsoDate();
    const dateTo = searchParams.get("dateTo") || plusDaysIsoDate(7);
    const status = searchParams.get("status") || undefined;

    const matches = await getMatches({
      dateFrom,
      dateTo,
      status,
    });

    return Response.json({ matches });
  } catch (error) {
    console.error("Matches API error:", error);

    return Response.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
