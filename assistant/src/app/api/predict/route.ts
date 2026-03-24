import { getMatchById, getTeamRecentMatches } from "../../../lib/football-data";
import {
  buildTeamFeatures,
  predictFromFeatures,
} from "../../../lib/build-features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPredictionLabel(prediction, match) {
  if (prediction === "home_win") return `${match.homeTeam} gewinnt`;
  if (prediction === "away_win") return `${match.awayTeam} gewinnt`;
  return "Unentschieden";
}

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
        competition: match.competition || null,
      },
      prediction: result.prediction,
      label: toPredictionLabel(result.prediction, match),
      confidence: result.confidence,
      modelScore: result.score,
      explanation: {
        formDiff: Number((homeFeatures.form - awayFeatures.form).toFixed(2)),
        goalsScoredDiff: Number(
          (homeFeatures.goalsScored - awayFeatures.goalsScored).toFixed(2)
        ),
        goalsConcededDiff: Number(
          (homeFeatures.goalsConceded - awayFeatures.goalsConceded).toFixed(2)
        ),
        pointsPerGameDiff: Number(
          (homeFeatures.pointsPerGame - awayFeatures.pointsPerGame).toFixed(2)
        ),
        homeAdvantage: 0.1,
      },
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