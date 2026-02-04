import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LapData {
  lapNumber: number;
  s1: number;        // en millisecondes
  s2: number;
  s3: number;
  total: number;
  s1Best: boolean;   // meilleur perso ce tour
  s2Best: boolean;
  s3Best: boolean;
  totalBest: boolean;
  isPit: boolean;    // tour de pit
}

interface DriverInfo {
  id: string;
  num: string;
  name: string;
  isCurrent: boolean;  // true = en piste actuellement
}

interface TeamDetails {
  teamId: string;
  teamName: string;
  kartNumber: string;
  club: string;
  color: string;
  currentLap: number;
  currentDriver: DriverInfo | null;
  drivers: DriverInfo[];
  laps: LapData[];
  bestLap: { s1: number; s2: number; s3: number; total: number };
  bestSectors: { s1: number; s2: number; s3: number };
}

function parseLapLine(line: string): LapData | null {
  // Format: D149605.L0014#31518|g27158|g32158|g90834
  // g = green (meilleur perso), p = pit
  const match = line.match(/\.L(\d+)#([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)/);
  if (!match) return null;
  
  const lapNumber = parseInt(match[1]);
  if (lapNumber === 0) return null;

  const parseTime = (str: string): { time: number; isBest: boolean; isPit: boolean } => {
    const isBest = str.startsWith('g');
    const isPit = str.startsWith('p');
    const cleanStr = str.replace(/^[gp]/, '');
    const time = parseInt(cleanStr) || 0;
    return { time, isBest, isPit };
  };

  const s1 = parseTime(match[2]);
  const s2 = parseTime(match[3]);
  const s3 = parseTime(match[4]);
  const total = parseTime(match[5]);

  return {
    lapNumber,
    s1: s1.time,
    s2: s2.time,
    s3: s3.time,
    total: total.time,
    s1Best: s1.isBest,
    s2Best: s2.isBest,
    s3Best: s3.isBest,
    totalBest: total.isBest,
    isPit: s1.isPit || total.isPit,
  };
}

function parseDriverInfo(xml: string): { 
  teamName: string; 
  kartNumber: string; 
  club: string; 
  color: string; 
  drivers: DriverInfo[]; 
  currentDriver: DriverInfo | null 
} {
  const result = {
    teamName: '',
    kartNumber: '',
    club: '',
    color: '',
    drivers: [] as DriverInfo[],
    currentDriver: null as DriverInfo | null,
  };

  // Parse team info - format: <driver id="149605" num="10" name="Team Name" color="#FF0000" ...>
  const teamMatch = xml.match(/<driver[^>]*id="(\d+)"[^>]*num="(\d+)"[^>]*name="([^"]+)"[^>]*color="([^"]*)"/);
  if (teamMatch) {
    result.kartNumber = teamMatch[2];
    result.teamName = teamMatch[3];
    result.color = teamMatch[4];
  }

  // Parse club
  const clubMatch = xml.match(/type="club"[^>]*value="([^"]+)"/);
  if (clubMatch) {
    result.club = clubMatch[1];
  }

  // Parse individual drivers - chercher current="1" pour le pilote actuel
  // Format nested: <driver id="12345" num="1" name="Pilote Nom" current="1"/>
  const driverRegex = /<driver\s+id="(\d+)"[^>]*num="(\d+)"[^>]*name="([^"]+)"[^>]*(?:current="(\d+)")?[^/]*\/>/gi;
  let driverMatch;
  
  while ((driverMatch = driverRegex.exec(xml)) !== null) {
    const driver: DriverInfo = {
      id: driverMatch[1],
      num: driverMatch[2],
      name: driverMatch[3],
      isCurrent: driverMatch[0].includes('current="1"'),
    };
    result.drivers.push(driver);
    if (driver.isCurrent) {
      result.currentDriver = driver;
    }
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { circuitId, driverId } = await req.json();
    
    console.log(`Fetching team details for circuit: ${circuitId}, driver: ${driverId}`);

    // Mapping des circuits vers leurs ports config (pas WS)
    const circuits: Record<string, number> = {
      'rkc': 7910,
      'rko-angerville': 8950,
      'lemans-karting': 8950,
      'paris-kart': 8950,
    };

    const port = circuits[circuitId];
    if (!port) {
      return new Response(
        JSON.stringify({ error: 'Circuit non trouvé' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire la requête API Apex Timing
    // D#-30 = 30 derniers tours, L#-999 = tous les tours, B#1 = meilleurs temps, INF = infos équipe
    const request = `D#-30#D${driverId}.L#-999#D${driverId}.B#1#D${driverId}.INF`;
    
    console.log(`API request: ${request}`);

    const response = await fetch(
      'https://www.apex-timing.com/live-timing/commonv2/functions/request.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://www.apex-timing.com',
          'Referer': `https://www.apex-timing.com/live-timing/${circuitId}/`,
        },
        body: `port=${port}&request=${encodeURIComponent(request)}`,
      }
    );

    const text = await response.text();
    console.log(`API response length: ${text.length}`);
    console.log(`API response preview: ${text.substring(0, 500)}`);
    
    const lines = text.split('\n').filter(l => l.trim());

    // Parser les données
    const laps: LapData[] = [];
    let bestLap = { s1: 0, s2: 0, s3: 0, total: 0 };
    let bestSectors = { s1: 0, s2: 0, s3: 0 };
    let driverInfo = { 
      teamName: '', 
      kartNumber: '', 
      club: '', 
      color: '', 
      drivers: [] as DriverInfo[], 
      currentDriver: null as DriverInfo | null 
    };

    for (const line of lines) {
      // Tours (format: D149605.L0014#...)
      if (line.includes('.L00') || line.match(/\.L\d{4}#/)) {
        const lap = parseLapLine(line);
        if (lap && lap.lapNumber > 0) {
          laps.push(lap);
          console.log(`Parsed lap ${lap.lapNumber}: S1=${lap.s1} S2=${lap.s2} S3=${lap.s3} Total=${lap.total}`);
        }
      }
      // Best Lap (format: D149605.BL#31518|27158|32158|90834)
      else if (line.includes('.BL#')) {
        const match = line.match(/\.BL#(\d+)\|(\d+)\|(\d+)\|(\d+)/);
        if (match) {
          bestLap = {
            s1: parseInt(match[1]) || 0,
            s2: parseInt(match[2]) || 0,
            s3: parseInt(match[3]) || 0,
            total: parseInt(match[4]) || 0,
          };
          console.log(`Best lap: ${JSON.stringify(bestLap)}`);
        }
      }
      // Best Sectors (format: D149605.BS#31484|27158|32158)
      else if (line.includes('.BS#')) {
        const match = line.match(/\.BS#(\d+)\|(\d+)\|(\d+)/);
        if (match) {
          bestSectors = {
            s1: parseInt(match[1]) || 0,
            s2: parseInt(match[2]) || 0,
            s3: parseInt(match[3]) || 0,
          };
          console.log(`Best sectors: ${JSON.stringify(bestSectors)}`);
        }
      }
      // Driver Info (format: D149605.INF#<driver ...>)
      else if (line.includes('.INF#')) {
        const xml = line.split('.INF#')[1] || '';
        driverInfo = parseDriverInfo(xml);
        console.log(`Driver info: ${driverInfo.teamName}, current: ${driverInfo.currentDriver?.name}`);
      }
    }

    // Trier les tours par numéro décroissant (plus récent en premier)
    laps.sort((a, b) => b.lapNumber - a.lapNumber);

    const result: TeamDetails = {
      teamId: driverId,
      teamName: driverInfo.teamName,
      kartNumber: driverInfo.kartNumber,
      club: driverInfo.club,
      color: driverInfo.color,
      currentLap: laps.length > 0 ? laps[0].lapNumber : 0,
      currentDriver: driverInfo.currentDriver,
      drivers: driverInfo.drivers,
      laps,
      bestLap,
      bestSectors,
    };

    console.log(`Returning ${laps.length} laps, ${driverInfo.drivers.length} drivers`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
