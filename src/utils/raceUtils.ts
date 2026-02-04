
/**
 * Utility functions for race time calculations
 */

export function parseTime(str: string | undefined | null): number {
    if (!str) return 0;
    // Remove emojis and cleanup
    const clean = str.replace(/[🟢🟣🔴⚪\s]/gu, '').trim();
    if (!clean) return 0;

    // Handle mm:ss.ms
    if (clean.includes(':')) {
        const parts = clean.split(':');
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        return (minutes * 60) + seconds;
    }

    // Handle ss.ms
    return parseFloat(clean) || 0;
}

export function formatTimeSting(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '--';
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

    // Threshold to determine if it's a split or a sector (e.g. 10 seconds buffer)
    // If S2 is just slightly slower than S1, it might be a slow sector, but usually splits are ~2x S1.
    // We explicitly check if S2 is LARGER than S1 by a significant margin that implies accumulation.

    // Logic for S2
    if (s1 > 0 && s2 > 0) {
        if (s2 > s1 + 5) { // If S2 is more than 5 seconds longer than S1, it's virtually guaranteed to be a split
            realS2 = formatTimeSting(s2 - s1);
        }
    }

    // Logic for S3
    if (s2 > 0 && s3 > 0) {
        if (s3 > s2 + 5) { // If S3 is more than 5s longer than S2 (cumulative), it's a lap time
            realS3 = formatTimeSting(s3 - s2);
        }
    }

    return { s1: realS1, s2: realS2, s3: realS3 };
}
