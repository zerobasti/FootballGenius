export async function getMatches(params: {
  dateFrom: string;
  dateTo: string;
  status?: string;
}) {
  const url = new URL("https://api.football-data.org/v4/matches");

  url.searchParams.set("dateFrom", params.dateFrom);
  url.searchParams.set("dateTo", params.dateTo);
  if (params.status) url.searchParams.set("status", params.status);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || "",
    },
    cache: "no-store",
  });

  const data = await res.json();

  return data.matches.map((m: any) => ({
    id: m.id,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    utcDate: m.utcDate,
    status: m.status,
  }));
}