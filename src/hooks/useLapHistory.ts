import { useState, useEffect, useRef } from 'react';
import { ApexDriverData } from '@/types/live';

export interface LapRecord {
  lapNumber: number;
  timestamp: number;
  myLapTime: string;
  myLapTimeMs: number;
  myPosition: number;
  gapToLeader: string;
  gapToAhead: string;
  gapToBehind: string;
  driverAhead: string;
  driverBehind: string;
  s1: string;
  s2: string;
  s3: string;
  // Secteurs des pilotes devant/derrière pour comparaison
  aheadS1: string;
  aheadS2: string;
  aheadS3: string;
  behindS1: string;
  behindS2: string;
  behindS3: string;
}

export interface GapDataPoint {
  lap: number;
  gapAhead: number;
  gapBehind: number;
}

export interface SectorComparisonPoint {
  lap: number;
  s1DiffAhead: number; // Positif = on perd du temps, Négatif = on gagne
  s2DiffAhead: number;
  s3DiffAhead: number;
  s1DiffBehind: number;
  s2DiffBehind: number;
  s3DiffBehind: number;
}

function parseLapTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+\.\d+)/);
  if (match) {
    return (parseInt(match[1]) * 60 + parseFloat(match[2])) * 1000;
  }
  const seconds = parseFloat(timeStr);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  return 0;
}

function parseGapToSeconds(gapStr: string): number {
  if (!gapStr || gapStr === '--' || gapStr === '') return 0;
  if (gapStr.includes('Tour')) {
    const laps = parseInt(gapStr) || 1;
    return laps * 90;
  }
  const value = parseFloat(gapStr);
  return isNaN(value) ? 0 : value;
}

function parseSectorTime(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/[🟣🟢]/gu, '').trim();
  const value = parseFloat(clean);
  return isNaN(value) || value > 100 ? 0 : value; // Ignore > 100s (pit stops)
}

export function useLapHistory(
  drivers: ApexDriverData[],
  myKart: string
) {
  const [lapHistory, setLapHistory] = useState<LapRecord[]>([]);
  const [gapData, setGapData] = useState<GapDataPoint[]>([]);
  const [sectorComparison, setSectorComparison] = useState<SectorComparisonPoint[]>([]);
  const lastLapRef = useRef('');
  const lastLapCountRef = useRef(0);

  useEffect(() => {
    if (!drivers || drivers.length === 0) return;
    
    const myDriver = drivers.find(d => d.kart === myKart);
    if (!myDriver) return;

    const currentLapCount = parseInt(myDriver.laps) || 0;
    
    // Detect new lap (either lap time changed or lap count increased)
    const hasNewLap = (myDriver.lastLap && myDriver.lastLap !== lastLapRef.current) || 
                      (currentLapCount > lastLapCountRef.current);
    
    if (hasNewLap && myDriver.lastLap) {
      lastLapRef.current = myDriver.lastLap;
      lastLapCountRef.current = currentLapCount;

      const myIndex = drivers.findIndex(d => d.kart === myKart);
      const driverAhead = myIndex > 0 ? drivers[myIndex - 1] : null;
      const driverBehind = myIndex < drivers.length - 1 ? drivers[myIndex + 1] : null;

      const lapRecord: LapRecord = {
        lapNumber: currentLapCount,
        timestamp: Date.now(),
        myLapTime: myDriver.lastLap,
        myLapTimeMs: parseLapTimeToMs(myDriver.lastLap),
        myPosition: parseInt(myDriver.position) || 0,
        gapToLeader: myDriver.gap || '',
        gapToAhead: driverAhead?.interval || '0.000',
        gapToBehind: driverBehind?.interval || '0.000',
        driverAhead: driverAhead?.team || '',
        driverBehind: driverBehind?.team || '',
        s1: myDriver.s1 || '',
        s2: myDriver.s2 || '',
        s3: myDriver.s3 || '',
        aheadS1: driverAhead?.s1 || '',
        aheadS2: driverAhead?.s2 || '',
        aheadS3: driverAhead?.s3 || '',
        behindS1: driverBehind?.s1 || '',
        behindS2: driverBehind?.s2 || '',
        behindS3: driverBehind?.s3 || '',
      };

      setLapHistory(prev => [...prev, lapRecord]);

      setGapData(prev => [...prev, {
        lap: lapRecord.lapNumber,
        gapAhead: parseGapToSeconds(lapRecord.gapToAhead),
        gapBehind: parseGapToSeconds(lapRecord.gapToBehind),
      }]);

      // Calculer les différences de secteurs
      const myS1 = parseSectorTime(myDriver.s1);
      const myS2 = parseSectorTime(myDriver.s2);
      const myS3 = parseSectorTime(myDriver.s3);
      const aheadS1 = parseSectorTime(driverAhead?.s1 || '');
      const aheadS2 = parseSectorTime(driverAhead?.s2 || '');
      const aheadS3 = parseSectorTime(driverAhead?.s3 || '');
      const behindS1 = parseSectorTime(driverBehind?.s1 || '');
      const behindS2 = parseSectorTime(driverBehind?.s2 || '');
      const behindS3 = parseSectorTime(driverBehind?.s3 || '');

      setSectorComparison(prev => [...prev, {
        lap: lapRecord.lapNumber,
        // Positif = on perd du temps vs devant, Négatif = on gagne
        s1DiffAhead: myS1 > 0 && aheadS1 > 0 ? myS1 - aheadS1 : 0,
        s2DiffAhead: myS2 > 0 && aheadS2 > 0 ? myS2 - aheadS2 : 0,
        s3DiffAhead: myS3 > 0 && aheadS3 > 0 ? myS3 - aheadS3 : 0,
        // Positif = on perd du temps vs derrière, Négatif = on gagne
        s1DiffBehind: myS1 > 0 && behindS1 > 0 ? myS1 - behindS1 : 0,
        s2DiffBehind: myS2 > 0 && behindS2 > 0 ? myS2 - behindS2 : 0,
        s3DiffBehind: myS3 > 0 && behindS3 > 0 ? myS3 - behindS3 : 0,
      }]);
    }
  }, [drivers, myKart, lapHistory.length]);

  return { lapHistory, gapData, sectorComparison };
}

export function getBestSectors(lapHistory: LapRecord[]): { s1: number; s2: number; s3: number } | null {
  if (lapHistory.length === 0) return null;

  const parseSectorTime = (s: string) => {
    const clean = s?.replace(/[🟣🟢]/gu, '').trim();
    return parseFloat(clean) || 0;
  };

  const s1Times = lapHistory.map(l => parseSectorTime(l.s1)).filter(t => t > 0);
  const s2Times = lapHistory.map(l => parseSectorTime(l.s2)).filter(t => t > 0);
  const s3Times = lapHistory.map(l => parseSectorTime(l.s3)).filter(t => t > 0);

  return {
    s1: s1Times.length > 0 ? Math.min(...s1Times) : 0,
    s2: s2Times.length > 0 ? Math.min(...s2Times) : 0,
    s3: s3Times.length > 0 ? Math.min(...s3Times) : 0,
  };
}

export function getAverageLapTime(laps: LapRecord[]): number {
  if (laps.length === 0) return 0;
  const validLaps = laps.filter(l => l.myLapTimeMs > 0);
  if (validLaps.length === 0) return 0;
  const sum = validLaps.reduce((acc, lap) => acc + lap.myLapTimeMs, 0);
  return sum / validLaps.length;
}
