import { getMatchById, getTeamRecentMatches } from "../../../lib/football-data";
import {
  buildTeamFeatures,
  predictFromFeatures,
} from "../../../lib/build-features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
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
      getTeamRecentMatches(match.homeTeamId, 5),
      getTeamRecentMatches(match.awayTeamId, 5),
    ]);

    const homeFeatures = buildTeamFeatures(match.homeTeamId, homeRecent);
    const awayFeatures = buildTeamFeatures(match.awayTeamId, awayRecent);

    const result = predictFromFeatures(homeFeatures, awayFeatures);

    return Response.json({
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        utcDate: match.utcDate,
        status: match.status,
        competition: match.competition,
      },
      prediction: result.prediction,
      confidence: result.confidence,
      modelScore: result.score,
      features: {
        home: homeFeatures,
        away: awayFeatures,
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