import { LapData, StintConfig, stintConfig } from '@/data/raceData';

export interface DriverStats {
  driver: string;
  laps: number;
  best: number;
  worst: number;
  avg: number;
  stdDev: number;
  consistency: number;
  bestS1: number;
  bestS2: number;
  bestS3: number;
  avgS1: number;
  avgS2: number;
  avgS3: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StintStats {
  stint: number;
  driver: string;
  code: string;
  laps: number;
  best: number;
  avg: number;
  stdDev: number;
}

/**
 * Get the driver for a specific lap number
 */
export function getDriverForLap(lapNumber: number): string | null {
  for (const stint of stintConfig) {
    if (lapNumber >= stint.startLap && lapNumber <= stint.endLap) {
      return stint.driver;
    }
  }
  return null;
}

/**
 * Filter valid laps (exclude pit laps with very high times)
 */
export function getValidLaps(laps: LapData[]): LapData[] {
  return laps.filter(l => l.total < 70000);
}

/**
 * Calculate statistics for a set of laps
 */
export function calculateStats(laps: LapData[]): Omit<DriverStats, 'driver' | 'trend'> | null {
  if (laps.length === 0) return null;
  
  const times = laps.map(l => l.total);
  const best = Math.min(...times);
  const worst = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  // Tours within 0.5s of best
  const threshold = best + 500;
  const consistentLaps = times.filter(t => t <= threshold).length;
  const consistency = (consistentLaps / times.length) * 100;
  
  // Sectors
  const s1Times = laps.map(l => l.s1);
  const s2Times = laps.map(l => l.s2);
  const s3Times = laps.map(l => l.s3);
  
  return {
    laps: times.length,
    best,
    worst,
    avg,
    stdDev,
    consistency,
    bestS1: Math.min(...s1Times),
    bestS2: Math.min(...s2Times),
    bestS3: Math.min(...s3Times),
    avgS1: s1Times.reduce((a, b) => a + b, 0) / s1Times.length,
    avgS2: s2Times.reduce((a, b) => a + b, 0) / s2Times.length,
    avgS3: s3Times.reduce((a, b) => a + b, 0) / s3Times.length,
  };
}

/**
 * Calculate trend based on last 10 laps
 */
export function calculateTrend(laps: LapData[]): 'up' | 'down' | 'stable' {
  if (laps.length < 10) return 'stable';
  
  const sortedLaps = [...laps].sort((a, b) => b.lap - a.lap);
  const last5 = sortedLaps.slice(0, 5);
  const prev5 = sortedLaps.slice(5, 10);
  
  const avgLast5 = last5.reduce((sum, l) => sum + l.total, 0) / last5.length;
  const avgPrev5 = prev5.reduce((sum, l) => sum + l.total, 0) / prev5.length;
  
  const diff = avgPrev5 - avgLast5;
  
  if (diff > 200) return 'up'; // Improving (faster times)
  if (diff < -200) return 'down'; // Getting slower
  return 'stable';
}

/**
 * Get stats for all drivers
 */
export function getAllDriverStats(allLaps: LapData[]): DriverStats[] {
  const validLaps = getValidLaps(allLaps);
  const driverLaps: Record<string, LapData[]> = {};
  
  for (const lap of validLaps) {
    const driver = getDriverForLap(lap.lap);
    if (driver) {
      if (!driverLaps[driver]) {
        driverLaps[driver] = [];
      }
      driverLaps[driver].push(lap);
    }
  }
  
  const stats: DriverStats[] = [];
  
  for (const [driver, laps] of Object.entries(driverLaps)) {
    const baseStats = calculateStats(laps);
    if (baseStats) {
      stats.push({
        driver,
        ...baseStats,
        trend: calculateTrend(laps),
      });
    }
  }
  
  return stats.sort((a, b) => a.best - b.best);
}

/**
 * Get stats by stint
 */
export function getStintStats(allLaps: LapData[]): StintStats[] {
  const validLaps = getValidLaps(allLaps);
  
  return stintConfig.map(stint => {
    const stintLaps = validLaps.filter(
      l => l.lap >= stint.startLap && l.lap <= stint.endLap
    );
    
    const stats = calculateStats(stintLaps);
    
    return {
      stint: stint.stint,
      driver: stint.driver,
      code: stint.code,
      laps: stintLaps.length,
      best: stats?.best || 0,
      avg: stats?.avg || 0,
      stdDev: stats?.stdDev || 0,
    };
  });
}

/**
 * Get top 10 best laps
 */
export function getTop10Laps(allLaps: LapData[]): Array<LapData & { driver: string }> {
  const validLaps = getValidLaps(allLaps);
  
  return validLaps
    .map(lap => ({
      ...lap,
      driver: getDriverForLap(lap.lap) || 'Unknown',
    }))
    .sort((a, b) => a.total - b.total)
    .slice(0, 10);
}

/**
 * Get theoretical optimal lap (best sectors combined)
 */
export function getTheoreticalBest(allLaps: LapData[]): { s1: number; s2: number; s3: number; total: number } {
  const validLaps = getValidLaps(allLaps);
  
  const bestS1 = Math.min(...validLaps.map(l => l.s1));
  const bestS2 = Math.min(...validLaps.map(l => l.s2));
  const bestS3 = Math.min(...validLaps.map(l => l.s3));
  
  return {
    s1: bestS1,
    s2: bestS2,
    s3: bestS3,
    total: bestS1 + bestS2 + bestS3,
  };
}

/**
 * Get global best lap
 */
export function getGlobalBest(allLaps: LapData[]): LapData | null {
  const validLaps = getValidLaps(allLaps);
  if (validLaps.length === 0) return null;
  
  return validLaps.reduce((best, lap) => 
    lap.total < best.total ? lap : best
  );
}

/**
 * Get last N laps for chart
 */
export function getLastNLaps(allLaps: LapData[], n: number = 20): LapData[] {
  return [...allLaps]
    .filter(l => l.total < 70000)
    .sort((a, b) => a.lap - b.lap)
    .slice(-n);
}
