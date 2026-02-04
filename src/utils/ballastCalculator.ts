// Ballast calculator for karting
// Available weights: 2.5kg, 10kg, 20kg

export interface BallastBreakdown {
  total: number;
  weights: { size: number; count: number }[];
}

export function calculateBallast(driverWeight: number, targetWeight: number): BallastBreakdown {
  // If driver is already at or over target, no ballast needed
  if (driverWeight >= targetWeight) {
    return { total: 0, weights: [] };
  }

  const needed = targetWeight - driverWeight;
  const weights: { size: number; count: number }[] = [];

  // Use greedy algorithm with available weights: 20kg, 10kg, 2.5kg
  let remaining = needed;

  // 20kg weights
  const twenties = Math.floor(remaining / 20);
  if (twenties > 0) {
    weights.push({ size: 20, count: twenties });
    remaining -= twenties * 20;
  }

  // 10kg weights
  const tens = Math.floor(remaining / 10);
  if (tens > 0) {
    weights.push({ size: 10, count: tens });
    remaining -= tens * 10;
  }

  // 2.5kg weights (round to nearest 2.5)
  const twoFives = Math.round(remaining / 2.5);
  if (twoFives > 0) {
    weights.push({ size: 2.5, count: twoFives });
  }

  const total = weights.reduce((sum, w) => sum + w.size * w.count, 0);

  return { total, weights };
}

export function formatBallast(breakdown: BallastBreakdown): string {
  if (breakdown.total === 0) return "Aucun lest";

  const parts = breakdown.weights.map(w => 
    w.count === 1 ? `${w.size}kg` : `${w.count}×${w.size}kg`
  );

  return `${breakdown.total}kg (${parts.join(' + ')})`;
}
