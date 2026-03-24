function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function actualScoreForTeam(match: any, teamId: number) {
  const isHome = match.homeTeamId === teamId;

  if (match.score?.winner === "DRAW") return 0.5;
  if (isHome && match.score?.winner === "HOME_TEAM") return 1;
  if (!isHome && match.score?.winner === "AWAY_TEAM") return 1;
  return 0;
}

function goalDiffForTeam(match: any, teamId: number) {
  const isHome = match.homeTeamId === teamId;
  const gf = isHome
    ? (match.score?.fullTime?.home ?? 0)
    : (match.score?.fullTime?.away ?? 0);
  const ga = isHome
    ? (match.score?.fullTime?.away ?? 0)
    : (match.score?.fullTime?.home ?? 0);

  return gf - ga;
}

function sortOldestFirst(matches: any[]) {
  return [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
}

function kFactorFromGoalDiff(goalDiff: number) {
  const abs = Math.abs(goalDiff);
  if (abs <= 1) return 24;
  if (abs === 2) return 28;
  return 32;
}

export function buildTeamElo(teamId: number, matches: any[]) {
  if (!matches?.length) {
    return {
      rating: 1500,
      trend: 0,
      matchesUsed: 0,
    };
  }

  let rating = 1500;
  const ordered = sortOldestFirst(matches);

  for (const match of ordered) {
    const isHome = match.homeTeamId === teamId;
    const venueAdjustedOpponent = 1500 + (isHome ? -45 : 45);

    const expected = expectedScore(rating, venueAdjustedOpponent);
    const actual = actualScoreForTeam(match, teamId);
    const goalDiff = goalDiffForTeam(match, teamId);
    const k = kFactorFromGoalDiff(goalDiff);

    rating = rating + k * (actual - expected);
  }

  return {
    rating: round(rating),
    trend: round(rating - 1500),
    matchesUsed: ordered.length,
  };
}

export function predictFromElo(homeElo: number, awayElo: number) {
  const homeAdvantage = 55;
  const adjHome = homeElo + homeAdvantage;
  const homeExpected = expectedScore(adjHome, awayElo);

  const diff = adjHome - awayElo;

  const drawProb = clamp(
    0.16 + Math.exp(-Math.abs(diff) / 140) * 0.14,
    0.12,
    0.30
  );

  const homeWinProb = homeExpected * (1 - drawProb);
  const awayWinProb = (1 - homeExpected) * (1 - drawProb);

  let prediction: "home_win" | "draw" | "away_win" = "draw";
  let confidence = drawProb;

  if (homeWinProb >= awayWinProb && homeWinProb >= drawProb) {
    prediction = "home_win";
    confidence = homeWinProb;
  } else if (awayWinProb >= homeWinProb && awayWinProb >= drawProb) {
    prediction = "away_win";
    confidence = awayWinProb;
  }

  return {
    prediction,
    confidence: round(confidence),
    probabilities: {
      homeWin: round(homeWinProb),
      draw: round(drawProb),
      awayWin: round(awayWinProb),
    },
    eloDiff: round(diff),
  };
}