import { useState, useEffect, useRef, useMemo } from 'react';
import { ApexDriverData } from '@/types/live';
import { LapRecord, getBestSectors, getAverageLapTime } from './useLapHistory';

export interface AIAdvice {
  id: string;
  timestamp: number;
  type: 'ATTACK' | 'DEFENSE' | 'PIT' | 'SECTOR' | 'PACE' | 'INFO' | 'STRATEGY';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  icon: string;
}

export interface PitWindow {
  isOpen: boolean;
  reason: string;
  driversInPit: string[];
  trackClear: boolean;
}

function parseGapToSeconds(gapStr: string): number {
  if (!gapStr || gapStr === '--' || gapStr === '') return 999;
  if (gapStr.includes('Tour')) return 999;
  const value = parseFloat(gapStr);
  return isNaN(value) ? 999 : value;
}

function parseSectorTime(sectorStr: string): number {
  if (!sectorStr) return 0;
  return parseFloat(sectorStr.replace(/[🟣🟢]/gu, '')) || 0;
}

function parseLapTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+\.\d+)/);
  if (match) {
    return (parseInt(match[1]) * 60 + parseFloat(match[2])) * 1000;
  }
  return 0;
}

export function useAIAdvisor(
  drivers: ApexDriverData[],
  myKart: string,
  lapHistory: LapRecord[],
  raceRemainingSeconds: number,
  pitStopsRequired: number,
  myPitsDone: number,
  advisorIntervalMs: number = 30000
) {
  const [advices, setAdvices] = useState<AIAdvice[]>([]);
  const lastAdviceTime = useRef(0);

  const myDriver = useMemo(() =>
    drivers.find(d => d.kart === myKart), [drivers, myKart]);

  const myIndex = useMemo(() =>
    drivers.findIndex(d => d.kart === myKart), [drivers, myKart]);

  // Analyze pit window
  const pitWindow = useMemo((): PitWindow => {
    // Find drivers currently in pits (onTrack time > 2:00)
    const driversInPit = drivers.filter(d => {
      const onTrack = d.onTrack || '';
      if (onTrack.includes(':')) {
        const parts = onTrack.split(':');
        const minutes = parseInt(parts[0]) || 0;
        if (minutes >= 2) return true;
      }
      return false;
    }).map(d => d.team);

    const pitsRemaining = pitStopsRequired - myPitsDone;
    const raceRemainingMinutes = raceRemainingSeconds / 60;
    const optimalStintLength = raceRemainingMinutes / Math.max(1, pitsRemaining);

    // Window is open if:
    // 1. Many drivers in pits (track is clear)
    // 2. Or we're in optimal pit window
    const trackClear = driversInPit.length >= 3;
    const inOptimalWindow = pitsRemaining > 0 && optimalStintLength <= 25;

    let reason = '';
    if (trackClear) {
      reason = `${driversInPit.length} pilotes aux stands - Piste calme!`;
    } else if (inOptimalWindow) {
      reason = `Fenêtre optimale: ${Math.round(optimalStintLength)}min/stint restant`;
    }

    return {
      isOpen: trackClear || inOptimalWindow,
      reason,
      driversInPit,
      trackClear,
    };
  }, [drivers, pitStopsRequired, myPitsDone, raceRemainingSeconds]);

  useEffect(() => {
    const now = Date.now();

    // Only generate advice every advisorIntervalMs
    if (now - lastAdviceTime.current < advisorIntervalMs) {
      return;
    }

    if (!myDriver || drivers.length === 0) return;

    const newAdvices: AIAdvice[] = [];
    lastAdviceTime.current = now;

    // ===== 1. ATTACK/DEFENSE ANALYSIS =====
    if (myIndex > 0) {
      const driverAhead = drivers[myIndex - 1];
      const gap = parseGapToSeconds(myDriver.interval);

      if (gap < 1.5 && gap > 0 && gap < 999) {
        newAdvices.push({
          id: `attack-${now}`,
          timestamp: now,
          type: 'ATTACK',
          priority: gap < 0.5 ? 'HIGH' : 'MEDIUM',
          message: `🎯 ATTAQUE! ${driverAhead.team} à ${gap.toFixed(1)}s - Push maximum!`,
          icon: '🎯',
        });
      } else if (gap < 3 && gap < 999) {
        newAdvices.push({
          id: `approach-${now}`,
          timestamp: now,
          type: 'ATTACK',
          priority: 'LOW',
          message: `📈 Tu te rapproches de ${driverAhead.team} (${gap.toFixed(1)}s)`,
          icon: '📈',
        });
      }
    }

    if (myIndex < drivers.length - 1 && myIndex >= 0) {
      const driverBehind = drivers[myIndex + 1];
      const gapBehind = parseGapToSeconds(driverBehind.interval);

      if (gapBehind < 1 && gapBehind < 999) {
        newAdvices.push({
          id: `defense-${now}`,
          timestamp: now,
          type: 'DEFENSE',
          priority: 'HIGH',
          message: `⚠️ DÉFENSE! ${driverBehind.team} à ${gapBehind.toFixed(1)}s - Protège ta position!`,
          icon: '⚠️',
        });
      } else if (gapBehind < 2 && gapBehind < 999) {
        newAdvices.push({
          id: `pressure-${now}`,
          timestamp: now,
          type: 'DEFENSE',
          priority: 'MEDIUM',
          message: `👀 ${driverBehind.team} se rapproche (${gapBehind.toFixed(1)}s)`,
          icon: '👀',
        });
      }
    }

    // ===== 2. PIT STRATEGY ANALYSIS =====
    if (pitWindow.isOpen) {
      newAdvices.push({
        id: `pit-window-${now}`,
        timestamp: now,
        type: 'PIT',
        priority: pitWindow.trackClear ? 'HIGH' : 'MEDIUM',
        message: `🔧 FENÊTRE PIT OUVERTE! ${pitWindow.reason}`,
        icon: '🔧',
      });
    }

    // Alert if pits remaining
    const pitsRemaining = pitStopsRequired - myPitsDone;
    if (pitsRemaining > 0) {
      const raceRemainingMinutes = raceRemainingSeconds / 60;
      const avgStintLength = raceRemainingMinutes / pitsRemaining;

      if (avgStintLength < 20) {
        newAdvices.push({
          id: `pit-urgent-${now}`,
          timestamp: now,
          type: 'STRATEGY',
          priority: 'HIGH',
          message: `⏰ URGENT: ${pitsRemaining} pit(s) restant(s), ~${Math.round(avgStintLength)}min/stint!`,
          icon: '⏰',
        });
      }
    }

    // ===== 3. SECTOR ANALYSIS =====
    if (lapHistory.length >= 2) {
      const lastLap = lapHistory[lapHistory.length - 1];
      const bestSectors = getBestSectors(lapHistory);

      if (lastLap && bestSectors) {
        const s1Time = parseSectorTime(lastLap.s1);
        const s2Time = parseSectorTime(lastLap.s2);
        const s3Time = parseSectorTime(lastLap.s3);

        const sectors = [
          { sector: 'S1', diff: s1Time - bestSectors.s1, time: s1Time },
          { sector: 'S2', diff: s2Time - bestSectors.s2, time: s2Time },
          { sector: 'S3', diff: s3Time - bestSectors.s3, time: s3Time },
        ].filter(s => s.time > 0 && s.time < 100); // Filter aberrant times

        const worstSector = sectors.sort((a, b) => b.diff - a.diff)[0];
        const bestSector = sectors.sort((a, b) => a.diff - b.diff)[0];

        if (worstSector && worstSector.diff > 0.5) {
          newAdvices.push({
            id: `sector-improve-${now}`,
            timestamp: now,
            type: 'SECTOR',
            priority: worstSector.diff > 1 ? 'MEDIUM' : 'LOW',
            message: `🔧 ${worstSector.sector} à améliorer: +${worstSector.diff.toFixed(2)}s`,
            icon: '🔧',
          });
        }

        if (bestSector && bestSector.diff < -0.1) {
          newAdvices.push({
            id: `sector-good-${now}`,
            timestamp: now,
            type: 'INFO',
            priority: 'LOW',
            message: `✅ Excellent ${bestSector.sector}: ${Math.abs(bestSector.diff).toFixed(2)}s gagné!`,
            icon: '✅',
          });
        }
      }
    }

    // ===== 4. PACE ANALYSIS =====
    if (lapHistory.length >= 3) {
      const last3Laps = lapHistory.slice(-3);
      const avgLast3 = getAverageLapTime(last3Laps);
      const sortedLaps = [...lapHistory].filter(l => l.myLapTimeMs > 0).sort((a, b) => a.myLapTimeMs - b.myLapTimeMs);
      const best3Laps = sortedLaps.slice(0, 3);
      const avgBest3 = getAverageLapTime(best3Laps);

      if (avgLast3 > 0 && avgBest3 > 0) {
        const paceGap = (avgLast3 - avgBest3) / 1000;

        if (paceGap > 2) {
          newAdvices.push({
            id: `pace-slow-${now}`,
            timestamp: now,
            type: 'PACE',
            priority: paceGap > 3 ? 'MEDIUM' : 'LOW',
            message: `📊 Rythme: +${paceGap.toFixed(1)}s vs meilleur - Trouve du temps!`,
            icon: '📊',
          });
        } else if (paceGap < 0.5) {
          newAdvices.push({
            id: `pace-good-${now}`,
            timestamp: now,
            type: 'INFO',
            priority: 'LOW',
            message: `🔥 Excellent rythme! Tu es à ${paceGap.toFixed(1)}s de ton meilleur pace`,
            icon: '🔥',
          });
        }
      }
    }

    // ===== 5. COMPARATIVE ANALYSIS =====
    if (myIndex > 0 && myIndex < drivers.length - 1) {
      const driverAhead = drivers[myIndex - 1];
      const driverBehind = drivers[myIndex + 1];

      const myLastLap = parseLapTimeToMs(myDriver.lastLap);
      const aheadLastLap = parseLapTimeToMs(driverAhead.lastLap);
      const behindLastLap = parseLapTimeToMs(driverBehind.lastLap);

      if (myLastLap > 0 && aheadLastLap > 0) {
        const diffAhead = (myLastLap - aheadLastLap) / 1000;
        if (diffAhead < -0.5) {
          newAdvices.push({
            id: `faster-ahead-${now}`,
            timestamp: now,
            type: 'ATTACK',
            priority: 'LOW',
            message: `⚡ Tu es ${Math.abs(diffAhead).toFixed(1)}s plus rapide que ${driverAhead.team}!`,
            icon: '⚡',
          });
        }
      }

      if (myLastLap > 0 && behindLastLap > 0) {
        const diffBehind = (behindLastLap - myLastLap) / 1000;
        if (diffBehind < -0.5) {
          newAdvices.push({
            id: `slower-behind-${now}`,
            timestamp: now,
            type: 'DEFENSE',
            priority: 'MEDIUM',
            message: `⚠️ ${driverBehind.team} est ${Math.abs(diffBehind).toFixed(1)}s plus rapide!`,
            icon: '⚠️',
          });
        }
      }
    }

    // Keep last 15 advices
    if (newAdvices.length > 0) {
      setAdvices(prev => [...prev, ...newAdvices].slice(-15));
    }
  }, [drivers, myKart, lapHistory, raceRemainingSeconds, pitStopsRequired, myPitsDone, pitWindow, advisorIntervalMs, myDriver, myIndex]);

  return { advices, pitWindow };
}
