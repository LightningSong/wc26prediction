// Scraper Data Mocks
export function getFifaRanking() {
  return {
    "Argentina": { rank: 1, points: 1855 },
    "France": { rank: 2, points: 1845 },
    "Brazil": { rank: 5, points: 1784 },
    "Mexico": { rank: 15, points: 1681 },
    "South Africa": { rank: 60, points: 1430 },
    "USA": { rank: 11, points: 1685 },
    "Canada": { rank: 40, points: 1492 },
  };
}

export function getLastMatches(teamName: string, limit = 12) {
  if (teamName === "Mexico") {
    return [
      { date: "2026-05-10", opponent: "Brazil", goals_scored: 1, goals_conceded: 2 },
      { date: "2026-04-12", opponent: "USA", goals_scored: 2, goals_conceded: 0 },
    ];
  } else if (teamName === "South Africa") {
    return [
      { date: "2026-05-15", opponent: "Nigeria", goals_scored: 1, goals_conceded: 1 },
      { date: "2026-04-20", opponent: "Egypt", goals_scored: 0, goals_conceded: 1 },
    ];
  }
  return Array(limit).fill({ date: "2026-01-01", opponent: "Unknown", goals_scored: 1, goals_conceded: 1 });
}

export function getH2H(teamA: string, teamB: string) {
  return { team_a_wins: 5, draws: 2, team_b_wins: 1 };
}

// Math Utilities
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poissonProbability(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function randomPoisson(lambda: number): number {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Model Prediction Logic
const decayFactor = 0.85;

function calculateTemporalStrength(matches: any[]) {
  if (!matches || matches.length === 0) return { atk: 1.0, def: 1.0 };
  let attack = 0, defense = 0, weightSum = 0;
  
  matches.forEach((match, i) => {
    let w = Math.pow(decayFactor, i);
    attack += match.goals_scored * w;
    defense += match.goals_conceded * w;
    weightSum += w;
  });

  return { atk: attack / weightSum, def: defense / weightSum };
}

export function calculateXg(rankA: any, rankB: any, statsA: any[], statsB: any[], h2h: any) {
  const rankDiffA = (rankA.points - rankB.points) / 500.0;
  
  const formA = calculateTemporalStrength(statsA);
  const formB = calculateTemporalStrength(statsB);

  const baseXg = 1.2;
  const totalH2h = Math.max(1, h2h.team_a_wins + h2h.team_b_wins + h2h.draws);
  const h2hA = ((h2h.team_a_wins - h2h.team_b_wins) / totalH2h) * 0.3;

  const xgA = Math.max(0.1, baseXg + rankDiffA + ((formA.atk - formB.def) * 0.2) + h2hA);
  const xgB = Math.max(0.1, baseXg - rankDiffA + ((formB.atk - formA.def) * 0.2) - h2hA);

  return { xgA, xgB };
}

export function generateProbabilityMatrix(xgA: number, xgB: number, maxGoals = 6) {
  let matrix = [];
  const bumpFactors: Record<string, number> = {
    "0-0": 1.15, "1-0": 1.10, "0-1": 1.10, "1-1": 1.12
  };

  let totalProb = 0;
  for (let a = 0; a <= maxGoals; a++) {
    for (let b = 0; b <= maxGoals; b++) {
      let prob = poissonProbability(a, xgA) * poissonProbability(b, xgB);
      const scoreKey = `${a}-${b}`;
      if (bumpFactors[scoreKey]) {
        prob *= bumpFactors[scoreKey];
      }
      matrix.push({ score_a: a, score_b: b, score: scoreKey, prob });
      totalProb += prob;
    }
  }

  matrix = matrix.map(m => ({ ...m, prob: (m.prob / totalProb) * 100.0 }));
  matrix.sort((a, b) => b.prob - a.prob);
  return matrix;
}

export function runMonteCarlo(xgA: number, xgB: number, simulations = 100000) {
  let winsA = 0, draws = 0, winsB = 0;
  for (let i = 0; i < simulations; i++) {
    const scoreA = randomPoisson(xgA);
    const scoreB = randomPoisson(xgB);
    if (scoreA > scoreB) winsA++;
    else if (scoreA === scoreB) draws++;
    else winsB++;
  }
  return {
    win_a: (winsA / simulations) * 100.0,
    draw: (draws / simulations) * 100.0,
    win_b: (winsB / simulations) * 100.0,
  };
}
