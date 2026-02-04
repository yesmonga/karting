// Time formatting utilities

/**
 * Convert milliseconds to time format M:SS.mmm
 */
export function msToTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3);
  return `${minutes}:${seconds.padStart(6, '0')}`;
}

/**
 * Convert milliseconds to short format (seconds only) S.mmm
 */
export function msToSeconds(ms: number): string {
  return (ms / 1000).toFixed(3);
}

/**
 * Format time difference with + or - prefix
 */
export function formatDiff(diff: number): string {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${(diff / 1000).toFixed(3)}s`;
}

/**
 * Format elapsed time HH:MM:SS
 */
export function formatElapsedTime(timeStr: string): string {
  return timeStr;
}

/**
 * Calculate percentage of stint completion
 */
export function calculateStintProgress(currentLap: number, startLap: number, endLap: number): number {
  const totalLaps = endLap - startLap + 1;
  const completedLaps = currentLap - startLap + 1;
  return Math.min(100, Math.max(0, (completedLaps / totalLaps) * 100));
}
