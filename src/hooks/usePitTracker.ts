import { useState, useEffect, useRef } from 'react';

export interface PitEvent {
  timestamp: number;
  pitNumber: number;
  lapNumber: number;
  position: number;
}

export function usePitTracker(
  currentPits: number,
  currentLap: number,
  currentPosition: number
) {
  const [pitHistory, setPitHistory] = useState<PitEvent[]>([]);
  const lastPitCount = useRef(0);

  useEffect(() => {
    if (currentPits > lastPitCount.current) {
      const newPit: PitEvent = {
        timestamp: Date.now(),
        pitNumber: currentPits,
        lapNumber: currentLap,
        position: currentPosition,
      };
      setPitHistory(prev => [...prev, newPit]);
      console.log(`🔧 PIT STOP #${currentPits} détecté au tour ${currentLap}`);
    }
    lastPitCount.current = currentPits;
  }, [currentPits, currentLap, currentPosition]);

  return {
    pitHistory,
    totalPits: currentPits,
    lastPit: pitHistory[pitHistory.length - 1] || null,
  };
}
