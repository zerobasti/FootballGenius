type MatchSummary = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  utcDate: string;
  status: string;
  competition?: string;
  homeTeamId?: number;
  awayTeamId?: number;
  score?: {
    winner?: string | null;
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
    halfTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

function getApiToken(): string {
  return (
    process.env.FOOTBALL_DATA_API_KEY ||
    process.env.FOOTBALL_DATA_TOKEN ||
    ""
  );
}

function mapMatch(m: any): MatchSummary {
  return {
    id: m.id,
    homeTeam: m.homeTeam?.name || "",
    awayTeam: m.awayTeam?.name || "",
    utcDate: m.utcDate,
    status: m.status,
    competition: m.competition?.name,
    homeTeamId: m.homeTeam?.id,
    awayTeamId: m.awayTeam?.id,
    score: {
      winner: m.score?.winner ?? null,
      fullTime: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
      halfTime: {
        home: m.score?.halfTime?.home ?? null,
        away: m.score?.halfTime?.away ?? null,
      },
    },
  };
}

export async function getMatches(params: {
  dateFrom: string;
  dateTo: string;
  status?: string;
}) {
  const url = new URL("https://api.football-data.org/v4/matches");

  url.searchParams.set("dateFrom", params.dateFrom);
  url.searchParams.set("dateTo", params.dateTo);

  if (params.status) {
    url.searchParams.set("status", params.status);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Auth-Token": getApiToken(),
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `football-data getMatches failed: ${res.status} ${JSON.stringify(data)}`
    );
  }

  if (!Array.isArray(data.matches)) {
    return [];
  }

  return data.matches.map(mapMatch);
}

export async function getTeamRecentMatches(
  teamId: number,
  limit = 8
): Promise<MatchSummary[]> {
  const url = new URL(`https://api.football-data.org/v4/teams/${teamId}/matches`);
  url.searchParams.set("status", "FINISHED");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      "X-Auth-Token": getApiToken(),
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `football-data getTeamRecentMatches failed: ${res.status} ${JSON.stringify(data)}`
    );
  }

  if (!Array.isArray(data.matches)) {
    return [];
  }

  return data.matches.map(mapMatch);
}

export async function getMatchById(
  matchId: number
): Promise<MatchSummary | null> {
  const today = new Date();

  for (let offset = -40; offset <= 40; offset += 10) {
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() + offset);

    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 9);

    const matches = await getMatches({
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    });

    const found = matches.find((m) => m.id === matchId);
    if (found) {
      return found;
    }
  }

  return null;
}