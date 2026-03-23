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
  const { searchParams } = new URL(req.url);

  const dateFrom = searchParams.get("dateFrom") || todayIsoDate();
  const dateTo = searchParams.get("dateTo") || plusDaysIsoDate(7);
  const status = searchParams.get("status") || undefined;

  const matches = await getMatches({
    dateFrom,
    dateTo,
    status,
  });

<<<<<<< HEAD
  return Response.json({ matches });
=======
  return Response.json({ matches });
}
>>>>>>> fa47905 (final fix)
