import { getMatchById, getTeamRecentMatches } from "../../../lib/football-data";
import { buildTeamElo, predictFromElo } from "../../../lib/elo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPredictionLabel(prediction: string, match: any) {
  if (prediction === "home_win") return `${match.homeTeam} gewinnt`;
  if (prediction === "away_win") return `${match.awayTeam} gewinnt`;
  return "Unentschieden";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const matchId = Number(body?.matchId);

    if (!matchId || Number.isNaN(matchId)) {
      return Response.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    const match = await getMatchById(matchId);

    if (!match) {
      return Response.json(
        { error: "match not found" },
        { status: 404 }
      );
    }

    if (!match.homeTeamId || !match.awayTeamId) {
      return Response.json(
        { error: "team ids missing on match" },
        { status: 500 }
      );
    }

    const [homeRecent, awayRecent] = await Promise.all([
      getTeamRecentMatches(match.homeTeamId, 8),
      getTeamRecentMatches(match.awayTeamId, 8),
    ]);

    if (!homeRecent.length || !awayRecent.length) {
      return Response.json(
        { error: "not enough recent match data for prediction" },
        { status: 400 }
      );
    }

    const homeElo = buildTeamElo(match.homeTeamId, homeRecent);
    const awayElo = buildTeamElo(match.awayTeamId, awayRecent);

    const result = predictFromElo(homeElo.rating, awayElo.rating);

    return Response.json({
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        utcDate: match.utcDate,
        status: match.status,
        competition: match.competition || null,
      },
      prediction: result.prediction,
      label: toPredictionLabel(result.prediction, match),
      confidence: result.confidence,
      elo: {
        home: homeElo,
        away: awayElo,
        diff: result.eloDiff,
      },
      probabilities: result.probabilities,
      diagnostics: {
        homeRecentMatches: homeRecent.length,
        awayRecentMatches: awayRecent.length,
      },
    });
  } catch (error) {
    console.error("predict error:", error);

    return Response.json(
      { error: "failed to build prediction" },
      { status: 500 }
    );
  }
}