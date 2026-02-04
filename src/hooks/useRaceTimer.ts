import { useState, useEffect } from 'react';

interface RaceTimerState {
  elapsed: number;
  remaining: number;
  percent: number;
  isRunning: boolean;
  formattedElapsed: string;
  formattedRemaining: string;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useRaceTimer(
  apexRemainingMs: number,
  raceDurationMinutes: number,
  lastUpdateTime: number
): RaceTimerState {
  const [state, setState] = useState<RaceTimerState>({
    elapsed: 0,
    remaining: raceDurationMinutes * 60,
    percent: 0,
    isRunning: false,
    formattedElapsed: '0:00:00',
    formattedRemaining: formatTime(raceDurationMinutes * 60),
  });

  useEffect(() => {
    const totalSeconds = raceDurationMinutes * 60;

    // If no Apex data, use fallback with raceStartTime logic
    if (!apexRemainingMs || apexRemainingMs <= 0) {
      if (!lastUpdateTime) {
        setState(prev => ({
          ...prev,
          isRunning: false,
          remaining: totalSeconds,
          formattedRemaining: formatTime(totalSeconds),
        }));
        return;
      }
    }

    const updateTimer = () => {
      let remainingSeconds: number;

      if (apexRemainingMs > 0) {
        // Use Apex timing data - calculate time passed since last update
        const timeSinceUpdate = Date.now() - lastUpdateTime;
        const remainingMs = Math.max(0, apexRemainingMs - timeSinceUpdate);
        remainingSeconds = Math.floor(remainingMs / 1000);
      } else if (lastUpdateTime) {
        // Fallback: use race start time
        const now = Date.now();
        const elapsedMs = now - lastUpdateTime;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        remainingSeconds = Math.max(0, totalSeconds - elapsedSec);
      } else {
        remainingSeconds = totalSeconds;
      }

      const elapsedSeconds = totalSeconds - remainingSeconds;
      const percent = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

      setState({
        elapsed: elapsedSeconds,
        remaining: remainingSeconds,
        percent,
        isRunning: remainingSeconds > 0,
        formattedElapsed: formatTime(elapsedSeconds),
        formattedRemaining: formatTime(remainingSeconds),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [apexRemainingMs, raceDurationMinutes, lastUpdateTime]);

  return state;
}
