type EloSnapshot = {
  rating: number;
  trend: number;
  matchesUsed: number;
};

type Probabilities = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

type EloPrediction = {
  prediction: "home_win" | "draw" | "away_win";
  confidence: number;
  probabilities: Probabilities;
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

function normalizeProbabilities(prob: Probabilities): Probabilities {
  const total = prob.homeWin + prob.draw + prob.awayWin;

  if (total <= 0) {
    return {
      homeWin: 0.33,
      draw: 0.34,
      awayWin: 0.33,
    };
  }

  return {
    homeWin: round(prob.homeWin / total),
    draw: round(prob.draw / total),
    awayWin: round(prob.awayWin / total),
  };
}

function getDecisionConfidence(prob: Probabilities) {
  const values = [prob.homeWin, prob.draw, prob.awayWin].sort((a, b) => b - a);
  return round(values[0] - values[1]);
}

export function decideOutcome(prob: Probabilities): "home_win" | "draw" | "away_win" {
  const { homeWin, draw, awayWin } = prob;

  const max = Math.max(homeWin, draw, awayWin);

  if (max < 0.5) {
    return "draw";
  }

  if (homeWin === max && homeWin - awayWin > 0.1) {
    return "home_win";
  }

  if (awayWin === max && awayWin - homeWin > 0.1) {
    return "away_win";
  }

  return "draw";
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

  const drawProb = clamp(
    0.18 + Math.exp(-Math.abs(eloDiff) / 120) * 0.12,
    0.14,
    0.30
  );

  const decisiveMass = 1 - drawProb;

  const rawProbabilities = {
    homeWin: expectedHomeNoDraw * decisiveMass,
    draw: drawProb,
    awayWin: (1 - expectedHomeNoDraw) * decisiveMass,
  };

  const probabilities = normalizeProbabilities(rawProbabilities);
  const prediction = decideOutcome(probabilities);
  const confidence = getDecisionConfidence(probabilities);

  return {
    prediction,
    confidence,
    probabilities,
    eloDiff: round(eloDiff),
  };
}