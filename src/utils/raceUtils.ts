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

    // Logic for S2: If S2 is cumulative (Split 2), it should be roughly S1 + Sector2.
    // Realistically Sector 2 is rarely < 10s or > 120s.
    // If S2 > S1 + 5s, we assume it's cumulative.
    if (s1 > 0 && s2 > 0) {
        if (s2 > s1 + 4) { // lowered threshold slightly
            realS2 = formatSeconds(s2 - s1);
        }
    }

    // Logic for S3: If S3 is cumulative (Lap Time), it is > S2 (Split 2).
    if (s2 > 0 && s3 > 0) {
        if (s3 > s2 + 4) {
            realS3 = formatSeconds(s3 - s2);
        }
    }

    // Edge Case: If S2 (109) > S3 (66), and S3 is a valid lap time... 
    // Then S2 might be garbage or parsed wrong. 
    // However, we can't easily guess the "real" S2 without more info.
    // We leave it as is, or we could try to see if S2 - S1 makes sense?
    // If we already subtracted S1, realS2 would be 87. 
    // If S3 (Cumulative) is 66. Then S2 (Cumulative) cannot be 109.

    return { s1: realS1, s2: realS2, s3: realS3 };
}
