feature/football-data-matches
import { getMatches } from "../../../lib/football-data";
import { getMatches } from "@/lib/football-data";
main

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const dateFrom =
    searchParams.get("dateFrom") ||
    new Date().toISOString().slice(0, 10);

  const dateTo =
    searchParams.get("dateTo") ||
    new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);

  const status = searchParams.get("status") || undefined;

  const matches = await getMatches({ dateFrom, dateTo, status });

  return Response.json({ matches });
feature/football-data-matches
}
=======
}
main
