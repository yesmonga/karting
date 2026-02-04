/**
 * Utility functions for race time calculations
 */

export function parseTime(str: string | undefined | null): number {
    if (!str) return 0;
    // Keep only digits, dots, colons. Replace comma with dot.
    const clean = str.replace(/,/g, '.').replace(/[^\d:.]/g, '');
    if (!clean) return 0;

    // Handle mm:ss.ms or m:ss.ms
    if (clean.includes(':')) {
        const parts = clean.split(':');
        // Handle cases like 1:04.234
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseFloat(parts[1]) || 0;
            return (minutes * 60) + seconds;
        }
    }

    // Handle ss.ms
    return parseFloat(clean) || 0;
}

export function formatSeconds(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '--';
    // If > 60, format as mm:ss.ms
    if (seconds >= 60) {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toFixed(3).padStart(6, '0'); // 04.123
        return `${m}:${s}`;
    }
    return seconds.toFixed(3);
}

/**
 * Calculates real individual sector times from potential cumulative split times.
 * Apex Timing often sends:
 * S1: Sector 1 time
 * S2: Sector 1 + Sector 2 (Split 2)
 * S3: Sector 1 + Sector 2 + Sector 3 (Lap time)
 * 
 * This function detects if they are cumulative and subtracts accordingly.
 */
export function calculateRealSectors(s1Str: string, s2Str: string, s3Str: string) {
    const s1 = parseTime(s1Str);
    const s2 = parseTime(s2Str);
    const s3 = parseTime(s3Str);

    let realS1 = s1Str;
    let realS2 = s2Str;
    let realS3 = s3Str;

    // Logic for S2:
    // If S2 is cumulative (Split 2), it is S1 + Sector2.
    // Sector times are usually comparable. Split 2 should be roughly 2x S1.
    // We use a safe ratio: If S2 > S1 * 1.5, it is likely cumulative.
    // (Unless S1 is super short and S2 super long, but 1.5x is a safer bet than fixed seconds)
    if (s1 > 0 && s2 > 0) {
        if (s2 > (s1 * 1.5)) {
            realS2 = formatSeconds(s2 - s1);
        }
    }

    // Logic for S3:
    // If S3 is cumulative (Lap Time), it is Split 2 + Sector 3.
    // It must be > S2 (Split 2).
    // Also, if S2 was detected as cumulative, S3 is likely cumulative too.
    if (s2 > 0 && s3 > 0) {
        // If S3 > S2 + a small buffer (to account for super fast S3? No, S3 is rarely < 5s)
        // If S3 is LapTime, it's roughly S2 + 20s.
        // If S3 is Sector, it's ~20s. S2 (Split) is ~40s.
        // So if S3 > S2, it is definitely LapTime (Cumulative).
        // (Unless S2 is Sector and S3 is Cumulative? Unlikely mix).

        // Check: If S3 > S2, it's likely Cumulative S3 vs Cumulative S2.
        if (s3 > s2) {
            realS3 = formatSeconds(s3 - s2);
        }
    }

    return { s1: realS1, s2: realS2, s3: realS3 };
}
