function getApiToken() {
  return (
    process.env.FOOTBALL_DATA_API_KEY ||
    process.env.FOOTBALL_DATA_TOKEN ||
    ""
  );
}

function mapMatch(m) {
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

export async function getMatches(params) {
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

export async function getTeamRecentMatches(teamId, limit = 5) {
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

export async function getMatchById(matchId) {
  const today = new Date();

  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 30);

  const to = new Date(today);
  to.setUTCDate(to.getUTCDate() + 365);

  const matches = await getMatches({
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  });

  return matches.find((m) => m.id === matchId) || null;
}