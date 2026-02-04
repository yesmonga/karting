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

    let isS2Cumulative = false;

    // Logic for S2:
    // If S2 is cumulative (Split 2), it is S1 + Sector2.
    // Sector times are usually comparable. Split 2 should be roughly 2x S1.
    // We use a safe ratio: If S2 > S1 * 1.5, it is likely cumulative.
    // (Unless S1 is super short and S2 super long, but 1.5x is a safer bet than fixed seconds)
    if (s1 > 0 && s2 > 0) {
        if (s2 > (s1 * 1.5)) {
            realS2 = formatSeconds(s2 - s1);
            isS2Cumulative = true;
        }
    }

    // Logic for S3:
    // Case A: S2 was Cumulative (Split 2). S3 is LapTime (Cumulative).
    // S3 (Lap) = S1 + S2 + S3. Split 2 = S1 + S2.
    // Real S3 = S3 - S2.
    // Case B: S2 was Sector. S3 is LapTime (Cumulative).
    // S3 (Lap) = S1 + S2 + S3.
    // Real S3 = S3 - (S1 + S2).

    if (s3 > 0) {
        if (isS2Cumulative) {
            // S2 is already Split 2.
            // If S3 is LapTime, it must be greater than S2 (Split 2).
            if (s3 > s2) {
                realS3 = formatSeconds(s3 - s2);
            }
        } else {
            // S2 is Sector 2. Need to subtract S1 + S2.
            if (s1 > 0 && s2 > 0) {
                // If S3 is LapTime, it must be greater than the sum of S1 and S2.
                if (s3 > (s1 + s2)) {
                    realS3 = formatSeconds(s3 - (s1 + s2));
                }
            }
            // If s1 or s2 is missing, we cannot reliably calculate real S3 if S2 was a sector.
            // In such cases, we leave realS3 as its original value (s3Str).
        }
    }

    return { s1: realS1, s2: realS2, s3: realS3 };
}
