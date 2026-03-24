function round(value) {
  return Math.round(value * 100) / 100;
}

export function buildTeamFeatures(teamId, matches) {
  if (!matches.length) {
    return {
      form: 0.5,
      goalsScored: 1,
      goalsConceded: 1,
      pointsPerGame: 1,
      matchesUsed: 0,
    };
  }

  let points = 0;
  let scored = 0;
  let conceded = 0;

  for (const match of matches) {
    const isHome = match.homeTeamId === teamId;

    const gf = isHome
      ? (match.score?.fullTime?.home ?? 0)
      : (match.score?.fullTime?.away ?? 0);

    const ga = isHome
      ? (match.score?.fullTime?.away ?? 0)
      : (match.score?.fullTime?.home ?? 0);

    scored += gf;
    conceded += ga;

    if (match.score?.winner === "DRAW") {
      points += 1;
    } else if (
      (isHome && match.score?.winner === "HOME_TEAM") ||
      (!isHome && match.score?.winner === "AWAY_TEAM")
    ) {
      points += 3;
    }
  }

  const n = matches.length;
  const ppg = points / n;

  return {
    form: round(ppg / 3),
    goalsScored: round(scored / n),
    goalsConceded: round(conceded / n),
    pointsPerGame: round(ppg),
    matchesUsed: n,
  };
}

export function predictFromFeatures(home, away) {
  const edge =
    (home.form - away.form) * 0.45 +
    (home.goalsScored - away.goalsScored) * 0.3 -
    (home.goalsConceded - away.goalsConceded) * 0.15 +
    0.1;

  let prediction = "draw";

  if (edge > 0.18) prediction = "home_win";
  else if (edge < -0.18) prediction = "away_win";

  const confidence = Math.max(
    0.5,
    Math.min(0.88, 0.5 + Math.abs(edge) * 0.55)
  );

  return {
    prediction,
    confidence: round(confidence),
    score: round(edge),
  };
}