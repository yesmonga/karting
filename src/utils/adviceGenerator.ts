import { DriverStats, getTheoreticalBest, getAllDriverStats } from './calculations';
import { LapData, drivers } from '@/data/raceData';
import { msToTime, formatDiff } from './timeFormat';

export interface Advice {
  id: string;
  type: 'performance' | 'strategy' | 'warning' | 'info';
  icon: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  driver?: string;
}

/**
 * Generate strategic advice based on race data
 */
export function generateAdvice(allLaps: LapData[]): Advice[] {
  const advice: Advice[] = [];
  const driverStats = getAllDriverStats(allLaps);
  const theoretical = getTheoreticalBest(allLaps);
  
  // Find best and most consistent drivers
  const bestDriver = driverStats[0];
  const mostConsistent = [...driverStats].sort((a, b) => b.consistency - a.consistency)[0];
  const leastConsistent = [...driverStats].sort((a, b) => a.consistency - b.consistency)[0];
  
  // Performance advice for each driver
  for (const stats of driverStats) {
    const sectorGaps = [
      { sector: 'S1', gap: stats.avgS1 - stats.bestS1, best: stats.bestS1 },
      { sector: 'S2', gap: stats.avgS2 - stats.bestS2, best: stats.bestS2 },
      { sector: 'S3', gap: stats.avgS3 - stats.bestS3, best: stats.bestS3 },
    ].sort((a, b) => b.gap - a.gap);
    
    const worstSector = sectorGaps[0];
    
    if (worstSector.gap > 300) {
      advice.push({
        id: `perf-${stats.driver}-sector`,
        type: 'performance',
        icon: '⚡',
        title: `${stats.driver} - Secteur ${worstSector.sector}`,
        message: `Perd en moyenne ${formatDiff(worstSector.gap)} en ${worstSector.sector}. Meilleur: ${(worstSector.best / 1000).toFixed(3)}s`,
        priority: 'high',
        driver: stats.driver,
      });
    }
  }
  
  // Consistency advice
  if (leastConsistent && leastConsistent.stdDev > 600) {
    advice.push({
      id: `consistency-${leastConsistent.driver}`,
      type: 'warning',
      icon: '🎯',
      title: `Régularité - ${leastConsistent.driver}`,
      message: `Écart-type élevé (${(leastConsistent.stdDev / 1000).toFixed(3)}s). Seulement ${leastConsistent.consistency.toFixed(1)}% de tours réguliers.`,
      priority: 'medium',
      driver: leastConsistent.driver,
    });
  }
  
  // Best driver highlight
  if (bestDriver) {
    advice.push({
      id: 'best-driver',
      type: 'info',
      icon: '🏆',
      title: 'Meilleur temps',
      message: `${bestDriver.driver} détient le meilleur tour: ${msToTime(bestDriver.best)}`,
      priority: 'low',
    });
  }
  
  // Consistency champion
  if (mostConsistent && mostConsistent.consistency > 40) {
    advice.push({
      id: 'most-consistent',
      type: 'info',
      icon: '📊',
      title: 'Plus régulier',
      message: `${mostConsistent.driver} est le plus régulier avec ${mostConsistent.consistency.toFixed(1)}% de tours constants`,
      priority: 'low',
    });
  }
  
  // Theoretical best
  const actualBest = Math.min(...driverStats.map(s => s.best));
  const theoreticalGap = actualBest - theoretical.total;
  
  if (theoreticalGap > 0) {
    advice.push({
      id: 'theoretical',
      type: 'strategy',
      icon: '🔮',
      title: 'Tour théorique',
      message: `Tour optimal possible: ${msToTime(theoretical.total)} (${formatDiff(-theoreticalGap)} vs meilleur réel)`,
      priority: 'medium',
    });
  }
  
  // Trend-based advice
  const improvingDrivers = driverStats.filter(s => s.trend === 'up');
  const decliningDrivers = driverStats.filter(s => s.trend === 'down');
  
  if (improvingDrivers.length > 0) {
    advice.push({
      id: 'trend-up',
      type: 'info',
      icon: '📈',
      title: 'En progression',
      message: `${improvingDrivers.map(d => d.driver).join(', ')} améliore(nt) leurs temps`,
      priority: 'low',
    });
  }
  
  if (decliningDrivers.length > 0) {
    advice.push({
      id: 'trend-down',
      type: 'warning',
      icon: '📉',
      title: 'Attention',
      message: `${decliningDrivers.map(d => d.driver).join(', ')} perd(ent) en rythme`,
      priority: 'medium',
    });
  }
  
  return advice.slice(0, 6); // Limit to 6 most relevant pieces of advice
}
