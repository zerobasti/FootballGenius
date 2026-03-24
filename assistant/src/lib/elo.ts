type EloSnapshot = {
  rating: number;
  trend: number;
  matchesUsed: number;
};

type EloPrediction = {
  prediction: "home_win" | "draw" | "away_win";
  confidence: number;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  eloDiff: number;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function sortOldestFirst(matches: any[]) {
  return [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
}

function getGoalsForAgainst(match: any, teamId: number) {
  const isHome = match.homeTeamId === teamId;

  const goalsFor = isHome
    ? (match.score?.fullTime?.home ?? 0)
    : (match.score?.fullTime?.away ?? 0);

  const goalsAgainst = isHome
    ? (match.score?.fullTime?.away ?? 0)
    : (match.score?.fullTime?.home ?? 0);

  return { goalsFor, goalsAgainst };
}

function actualScore(match: any, teamId: number) {
  const isHome = match.homeTeamId === teamId;

  if (match.score?.winner === "DRAW") return 0.5;
  if (isHome && match.score?.winner === "HOME_TEAM") return 1;
  if (!isHome && match.score?.winner === "AWAY_TEAM") return 1;
  return 0;
}

function recencyWeight(index: number, total: number) {
  if (total <= 1) return 1;
  const normalized = index / (total - 1);
  return 0.75 + normalized * 0.5;
}

function goalDiffMultiplier(goalDiff: number) {
  const abs = Math.abs(goalDiff);
  if (abs <= 1) return 1;
  if (abs === 2) return 1.15;
  if (abs === 3) return 1.3;
  return 1.45;
}

function dynamicK(goalDiff: number, weight: number) {
  const baseK = 24;
  return baseK * goalDiffMultiplier(goalDiff) * weight;
}

export function buildTeamElo(teamId: number, matches: any[]): EloSnapshot {
  if (!matches?.length) {
    return {
      rating: 1500,
      trend: 0,
      matchesUsed: 0,
    };
  }

  const ordered = sortOldestFirst(matches);
  let rating = 1500;

  for (let i = 0; i < ordered.length; i++) {
    const match = ordered[i];
    const isHome = match.homeTeamId === teamId;

    const weight = recencyWeight(i, ordered.length);
    const opponentBase = 1500;
    const homeAdvantage = 55;

    const opponentAdjusted = isHome
      ? opponentBase - homeAdvantage
      : opponentBase + homeAdvantage;

    const expected = expectedScore(rating, opponentAdjusted);
    const actual = actualScore(match, teamId);

    const { goalsFor, goalsAgainst } = getGoalsForAgainst(match, teamId);
    const gd = goalsFor - goalsAgainst;
    const k = dynamicK(gd, weight);

    rating = rating + k * (actual - expected);
  }

  return {
    rating: round(rating),
    trend: round(rating - 1500),
    matchesUsed: ordered.length,
  };
}

export function predictFromElo(
  homeRating: number,
  awayRating: number
): EloPrediction {
  const homeAdvantage = 55;
  const adjustedHome = homeRating + homeAdvantage;

  const expectedHomeNoDraw = expectedScore(adjustedHome, awayRating);
  const eloDiff = adjustedHome - awayRating;

  // Draw-Wahrscheinlichkeit:
  // höher bei engen Spielen, niedriger bei klaren Elo-Unterschieden
  const drawProb = clamp(
    0.18 + Math.exp(-Math.abs(eloDiff) / 120) * 0.12,
    0.14,
    0.30
  );

  const decisiveMass = 1 - drawProb;
  const homeWinProb = expectedHomeNoDraw * decisiveMass;
  const awayWinProb = (1 - expectedHomeNoDraw) * decisiveMass;

  let prediction: "home_win" | "draw" | "away_win" = "draw";
  let confidence = drawProb;

  if (homeWinProb >= awayWinProb && homeWinProb >= drawProb) {
    prediction = "home_win";
    confidence = homeWinProb;
  } else if (awayWinProb >= homeWinProb && awayWinProb >= drawProb) {
    prediction = "away_win";
    confidence = awayWinProb;
  }

  const total = homeWinProb + drawProb + awayWinProb;

  return {
    prediction,
    confidence: round(confidence / total),
    probabilities: {
      homeWin: round(homeWinProb / total),
      draw: round(drawProb / total),
      awayWin: round(awayWinProb / total),
    },
    eloDiff: round(eloDiff),
  };
}