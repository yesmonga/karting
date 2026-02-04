// PDF parsing utilities for race data extraction - Apex Timing format
import { ImportedLapData, TeamData, ParsedPDFData, ParsedStintData } from '@/types/race';

// Dynamically load PDF.js from CDN
let pdfjs: any = null;

async function loadPdfJs() {
  if (pdfjs) return pdfjs;
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
  
  pdfjs = (window as any).pdfjsLib;
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  
  return pdfjs;
}

// Extract text content from a PDF file
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) {
    throw new Error('PDF.js not loaded');
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

// Parse lap time string (format: "1:06.309" or "66.309") to milliseconds
export function parseTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;
  
  const cleaned = timeStr.trim().replace(',', '.');
  
  if (cleaned.includes(':')) {
    const [mins, secs] = cleaned.split(':');
    return Math.round((parseInt(mins) * 60 + parseFloat(secs)) * 1000);
  }
  
  return Math.round(parseFloat(cleaned) * 1000);
}

// Parse sector time to milliseconds
export function parseSectorToMs(sectorStr: string): number {
  if (!sectorStr) return 0;
  const cleaned = sectorStr.trim().replace(',', '.');
  return Math.round(parseFloat(cleaned) * 1000);
}

// Parse track time format HH:MM:SS to milliseconds
export function parseTrackTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  }
  return 0;
}

// Detect session type from filename or content
export function detectSessionType(filename: string, content: string): 'essais' | 'qualif' | 'course' {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  if (lowerFilename.includes('essais') || lowerContent.includes('essais')) return 'essais';
  if (lowerFilename.includes('qualif') || lowerContent.includes('qualification')) return 'qualif';
  if (lowerFilename.includes('course') || lowerContent.includes('course')) return 'course';
  
  return 'course';
}

// Parse ranking PDF content - Works with PDF.js extracted text
// The text is often on a single line, so we use regex patterns instead of line parsing
export function parseRanking(content: string): { teams: TeamData[]; totalKarts: number } {
  const teams: TeamData[] = [];
  
  console.log('=== DEBUG parseRanking ===');
  console.log('Content length:', content.length);
  
  // Clean content
  const cleanContent = content
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ');
  
  console.log('Sample (first 800 chars):', cleanContent.substring(0, 800));
  
  // METHOD 1: Find pattern "position kart TEAMNAME" followed by best lap time
  // Example: "1 19 FAMILLE RECOMPOSEE 1:05.380" or "2 32 KRT LEGACY PRO 13.270 13.270 1:05.231"
  // Pattern: 1-2 digit position, 1-3 digit kart, team name (caps), then numbers/times
  const teamRegex = /\b(\d{1,2})\s+(\d{1,3})\s+([A-Z][A-Z0-9\s\-\.'&]{2,40}?)(?=\s+(?:\d+\s+Tours|\d{1,3}\.\d{3}|\d:\d{2}\.\d{3}))/gi;
  
  let match;
  while ((match = teamRegex.exec(cleanContent)) !== null) {
    const position = parseInt(match[1]);
    const kartNumber = parseInt(match[2]);
    let teamName = match[3].trim();
    
    // Filter false positives
    if (position > 50 || position < 1) continue;
    if (kartNumber > 100 || kartNumber < 1) continue;
    if (teamName.length < 2) continue;
    
    // Skip if this looks like a header or non-team text
    if (teamName.includes('Equipe') || teamName.includes('Kart') || teamName.includes('TIMING')) continue;
    
    // Clean team name - remove trailing partial data
    teamName = teamName.replace(/\s+\d+$/, '').replace(/\s+$/, '').trim();
    
    // Skip duplicates
    if (teams.some(t => t.kartNumber === kartNumber)) continue;
    
    // Find best lap time after team name
    const afterMatch = cleanContent.substring(match.index + match[0].length, match.index + match[0].length + 150);
    const bestLapMatch = afterMatch.match(/(\d:\d{2}\.\d{3})/);
    const bestLap = bestLapMatch ? parseTimeToMs(bestLapMatch[1]) : 0;
    
    console.log(`Found team: P${position} K${kartNumber} "${teamName}" best:${bestLap}ms`);
    
    teams.push({
      position,
      kartNumber,
      teamName,
      totalLaps: 0,
      bestLap,
      laps: [],
      stints: [],
      pitStops: [],
    });
  }
  
  // METHOD 2: If no teams found, try the "XX - TEAMNAME" pattern (from pit stops format)
  if (teams.length === 0) {
    console.log('Method 1 failed, trying "XX - NAME" pattern...');
    
    const altRegex = /\b(\d{1,3})\s*-\s*([A-Z][A-Z0-9\s\-\.'&]{2,40}?)(?=\s+(?:Tour|Heure|Total|\d{1,3}\s*-\s*[A-Z]|$))/gi;
    let pos = 1;
    
    while ((match = altRegex.exec(cleanContent)) !== null) {
      const kartNumber = parseInt(match[1]);
      const teamName = match[2].trim();
      
      if (kartNumber > 100 || kartNumber < 1) continue;
      if (teamName.length < 2) continue;
      if (teams.some(t => t.kartNumber === kartNumber)) continue;
      
      console.log(`Alt pattern: K${kartNumber} "${teamName}"`);
      
      teams.push({
        position: pos++,
        kartNumber,
        teamName,
        totalLaps: 0,
        bestLap: 0,
        laps: [],
        stints: [],
        pitStops: [],
      });
    }
  }
  
  teams.sort((a, b) => a.position - b.position);
  
  console.log(`=== RESULT: ${teams.length} teams parsed ===`);
  teams.slice(0, 10).forEach(t => console.log(`  ${t.position}. #${t.kartNumber} ${t.teamName}`));
  
  return { teams, totalKarts: teams.length };
}

// Parse pit stops PDF content - Apex Timing format
// Splits content by "XX - TEAMNAME" pattern to find each team's section
export function parsePitStopsWithStints(content: string): Map<number, ParsedStintData[]> {
  const teamStints = new Map<number, ParsedStintData[]>();
  
  console.log('=== DEBUG parsePitStopsWithStints ===');
  console.log('Content length:', content.length);
  
  // Clean content but preserve some structure
  const cleanContent = content
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ');
  
  // Split by team header pattern "XX - TEAMNAME"
  // We need to find each occurrence and extract the section until the next team
  const teamHeaderRegex = /(\d{1,3})\s*-\s*([A-Z][A-Z0-9\s\-\.'&]{2,40}?)(?=\s+(?:Tour|Heure|[A-Z]{2,}\/|$))/gi;
  const teamHeaders: { kart: number; name: string; index: number }[] = [];
  
  let headerMatch;
  while ((headerMatch = teamHeaderRegex.exec(cleanContent)) !== null) {
    const kart = parseInt(headerMatch[1]);
    if (kart >= 1 && kart <= 100) {
      teamHeaders.push({
        kart,
        name: headerMatch[2].trim(),
        index: headerMatch.index
      });
    }
  }
  
  console.log(`Found ${teamHeaders.length} team headers`);
  
  // Process each team section
  for (let i = 0; i < teamHeaders.length; i++) {
    const header = teamHeaders[i];
    const nextIndex = i < teamHeaders.length - 1 ? teamHeaders[i + 1].index : cleanContent.length;
    const section = cleanContent.substring(header.index, nextIndex);
    
    console.log(`Processing team ${header.kart} - ${header.name}`);
    
    const stints: ParsedStintData[] = [];
    
    // Find stint lines: "stintNum endLap HH:MM:SS ..."
    // Pattern: small number (1-20), larger number (1-300), time HH:MM:SS
    const stintRegex = /\b(\d{1,2})\s+(\d{1,3})\s+(\d{2}:\d{2}:\d{2})/g;
    let stintMatch;
    
    while ((stintMatch = stintRegex.exec(section)) !== null) {
      const stintNumber = parseInt(stintMatch[1]);
      const endLap = parseInt(stintMatch[2]);
      
      // Validate stint number (1-20) and end lap (1-300)
      if (stintNumber > 20 || stintNumber < 1) continue;
      if (endLap > 300 || endLap < 1) continue;
      
      // Skip if we already have this stint number for this team
      if (stints.some(s => s.stintNumber === stintNumber)) continue;
      
      // Get text after match to find lap times
      const afterStint = section.substring(stintMatch.index, stintMatch.index + 250);
      
      // Find lap times (format M:SS.mmm)
      const lapTimes = afterStint.match(/\d:\d{2}\.\d{3}/g);
      let bestLapMs = 0;
      let avgLapMs = 0;
      
      if (lapTimes && lapTimes.length >= 1) {
        bestLapMs = parseTimeToMs(lapTimes[0]);
        if (lapTimes.length >= 2) {
          avgLapMs = parseTimeToMs(lapTimes[1]);
        }
      }
      
      // Find laps count - look for a number between the HH:MM:SS times
      // After "En piste" time there should be a laps count
      let lapsCount = 0;
      const lapsMatch = afterStint.match(/\d{2}:\d{2}:\d{2}\s+(\d{1,3})\s+\d{2}:\d{2}:\d{2}/);
      if (lapsMatch) {
        lapsCount = parseInt(lapsMatch[1]);
      }
      
      // If no lapsCount found, calculate from previous stint
      if (lapsCount === 0) {
        if (stints.length > 0) {
          lapsCount = endLap - stints[stints.length - 1].endLap;
        } else {
          lapsCount = endLap;
        }
      }
      
      const isFinish = afterStint.includes('Arrivée');
      
      console.log(`  Stint ${stintNumber}: endLap=${endLap}, laps=${lapsCount}, best=${bestLapMs}ms`);
      
      stints.push({
        stintNumber,
        endLap,
        trackTime: '',
        trackTimeMs: 0,
        lapsCount,
        bestLap: lapTimes?.[0] || '',
        bestLapMs,
        avgLap: lapTimes?.[1] || '',
        avgLapMs,
        pitDuration: '',
        pitDurationMs: 0,
        isFinish,
      });
    }
    
    if (stints.length > 0) {
      teamStints.set(header.kart, stints);
    }
  }
  
  console.log(`=== RESULT: Stints for ${teamStints.size} teams ===`);
  
  return teamStints;
}

// Parse lap history PDF content - Apex Timing format
export function parseLapHistory(content: string): Map<number, ImportedLapData[]> {
  const teamLaps = new Map<number, ImportedLapData[]>();
  
  console.log('=== DEBUG parseLapHistory ===');
  console.log('Content length:', content.length);
  
  // Clean content
  const cleanContent = content
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ');
  
  // Find team headers "XX - TEAMNAME"
  const teamHeaderRegex = /(\d{1,3})\s*-\s*([A-Z][A-Z0-9\s\-\.'&]{2,40}?)(?=\s+[A-Z]{2,})/gi;
  const teamHeaders: { kart: number; name: string; index: number }[] = [];
  
  let headerMatch;
  while ((headerMatch = teamHeaderRegex.exec(cleanContent)) !== null) {
    const kart = parseInt(headerMatch[1]);
    if (kart >= 1 && kart <= 100) {
      teamHeaders.push({
        kart,
        name: headerMatch[2].trim(),
        index: headerMatch.index
      });
    }
  }
  
  console.log(`Found ${teamHeaders.length} team headers in lap history`);
  
  // Process each team section
  for (let i = 0; i < teamHeaders.length; i++) {
    const header = teamHeaders[i];
    const nextIndex = i < teamHeaders.length - 1 ? teamHeaders[i + 1].index : cleanContent.length;
    const section = cleanContent.substring(header.index, nextIndex);
    
    const laps: ImportedLapData[] = [];
    
    // Find lap time sequences
    // Format: "- 66.709 66.392 66.049" (starting from lap 1)
    // Or: "13 65.658 65.495 65.598" (starting from lap 13)
    // We look for: "-" or number, followed by multiple XX.XXX times
    
    const timeLineRegex = /(?:^|\s)(-|\d{1,3})\s+((?:\d{2,3}\.\d{3}\s*)+)/g;
    let lineMatch;
    
    while ((lineMatch = timeLineRegex.exec(section)) !== null) {
      const startIndicator = lineMatch[1];
      const timesStr = lineMatch[2];
      
      let startLap = 1;
      if (startIndicator !== '-') {
        const parsed = parseInt(startIndicator);
        // Validate it's a reasonable lap number (not a year or other large number)
        if (parsed > 0 && parsed < 300) {
          startLap = parsed;
        } else {
          continue;
        }
      }
      
      // Extract individual times
      const times = timesStr.match(/\d{2,3}\.\d{3}/g);
      if (!times) continue;
      
      times.forEach((timeStr, index) => {
        const lapNumber = startLap + index;
        const totalMs = Math.round(parseFloat(timeStr) * 1000);
        
        // Filter invalid times (pit laps are usually > 90s, normal laps 60-75s for karting)
        // We keep everything reasonable (50s - 180s) and let the UI filter pits
        if (totalMs < 50000 || totalMs > 180000) return;
        
        // Avoid duplicates
        if (!laps.some(l => l.lap === lapNumber)) {
          laps.push({
            lap: lapNumber,
            s1: 0,
            s2: 0,
            s3: 0,
            total: totalMs,
          });
        }
      });
    }
    
    laps.sort((a, b) => a.lap - b.lap);
    
    if (laps.length > 0) {
      console.log(`  Kart ${header.kart}: ${laps.length} laps found`);
      teamLaps.set(header.kart, laps);
    }
  }
  
  console.log(`=== RESULT: Laps for ${teamLaps.size} teams ===`);
  
  return teamLaps;
}

// Legacy interface for backwards compatibility
export interface ParsedStint {
  stintNumber: number;
  pitLap: number;
  trackTimeMs: number;
  lapsCount: number;
  bestLapMs: number;
  avgLapMs: number;
}

// Legacy function
export function parsePitStops(content: string): Map<number, number[]> {
  const teamPitStops = new Map<number, number[]>();
  const stintsData = parsePitStopsWithStints(content);
  
  stintsData.forEach((stints, kart) => {
    teamPitStops.set(kart, stints.map(s => s.endLap));
  });
  
  return teamPitStops;
}

// Main function to parse all PDF data
export function combineParsedData(
  lapHistoryContent: string,
  pitStopsContent: string,
  rankingContent: string,
  filename: string
): ParsedPDFData {
  const sessionType = detectSessionType(filename, rankingContent);
  const { teams, totalKarts } = parseRanking(rankingContent);
  const lapHistory = parseLapHistory(lapHistoryContent);
  const pitStops = parsePitStops(pitStopsContent);
  const stintsData = parsePitStopsWithStints(pitStopsContent);
  
  teams.forEach(team => {
    team.laps = lapHistory.get(team.kartNumber) || [];
    team.pitStops = pitStops.get(team.kartNumber) || [];
    team.stints = stintsData.get(team.kartNumber) || [];
    
    if (team.totalLaps === 0 && team.stints.length > 0) {
      const lastStint = team.stints[team.stints.length - 1];
      team.totalLaps = lastStint.endLap;
    }
    
    if (team.totalLaps === 0 && team.laps.length > 0) {
      team.totalLaps = team.laps.length;
    }
  });
  
  return {
    teams,
    sessionType,
    totalKarts,
  };
}

// Detect pit stops from lap time gaps
export function detectPitStopsFromLapTimes(laps: ImportedLapData[], threshold: number = 10000): number[] {
  const pitStops: number[] = [];
  
  if (laps.length < 2) return pitStops;
  
  const times = laps.map(l => l.total).filter(t => t > 0 && t < 120000);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  for (let i = 1; i < laps.length; i++) {
    if (laps[i].total > avgTime + threshold) {
      pitStops.push(laps[i].lap);
    }
  }
  
  return pitStops;
}

// Generate stint configuration from pit stops
export function generateStintsFromPitStops(
  laps: ImportedLapData[],
  pitStops: number[]
): Array<{ stint: number; startLap: number; endLap: number }> {
  const stints: Array<{ stint: number; startLap: number; endLap: number }> = [];
  
  if (laps.length === 0) return stints;
  
  const sortedLaps = [...laps].sort((a, b) => a.lap - b.lap);
  const firstLap = sortedLaps[0].lap;
  const lastLap = sortedLaps[sortedLaps.length - 1].lap;
  
  const sortedPits = [...pitStops].sort((a, b) => a - b);
  
  let stintNumber = 1;
  let currentStart = firstLap;
  
  for (const pitLap of sortedPits) {
    if (pitLap > currentStart && pitLap <= lastLap) {
      stints.push({
        stint: stintNumber,
        startLap: currentStart,
        endLap: pitLap - 1,
      });
      stintNumber++;
      currentStart = pitLap + 1;
    }
  }
  
  if (currentStart <= lastLap) {
    stints.push({
      stint: stintNumber,
      startLap: currentStart,
      endLap: lastLap,
    });
  }
  
  return stints;
}
