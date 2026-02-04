import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Driver {
  driverId: string;  // ID pour l'API détails
  position: string;
  kart: string;
  team: string;
  s1: string;
  s2: string;
  s3: string;
  lastLap: string;
  bestLap: string;
  gap: string;
  interval: string;
  laps: string;
  onTrack: string;
  pits: string;
  penalty: string;
}

interface Comment {
  time: string;
  text: string;
  kart?: string;
}

interface ApexData {
  circuit: string;
  session: string;
  timestamp: string;
  drivers: Driver[];
  comments: Comment[];
  raceTimeRemaining: number;  // Temps restant en ms depuis dyn1|countdown
  status: 'CONNECTING' | 'CONNECTED' | 'TIMEOUT' | 'ERROR' | 'NO_DATA';
}

function parseComments(html: string): Comment[] {
  const comments: Comment[] = [];
  
  if (!html || html.trim() === '') {
    return comments;
  }

  // Le HTML des commentaires ressemble à :
  // <p><b>16:09</b>9Avertissement - CONTACT</p>
  // <p><b>16:09</b>11Avertissement - CONTACT</p>
  // <p><b>16:04</b>7Pénalité - 10 SECONDES - CONTACT</p>
  // <p><b>16:00</b>Départ</p>

  // Normaliser le HTML (enlever les <p> et </p>)
  const cleanHtml = html.replace(/<\/?p>/gi, '');

  // Séparer par <b> pour avoir chaque bloc de commentaire
  const blocks = cleanHtml.split(/<b>/i).filter(b => b.trim());

  for (const block of blocks) {
    // Chaque bloc commence par "HH:MM</b>..."
    const match = block.match(/^(\d{1,2}:\d{2})<\/b>(.*)$/is);
    if (!match) continue;

    const time = match[1];
    let content = match[2].trim();

    // Nettoyer les balises HTML
    content = content.replace(/<[^>]+>/g, '').trim();

    if (!content) {
      // Commentaire sans texte (juste l'heure)
      continue;
    }

    // Extraire le numéro de kart s'il est au début (1-2 chiffres suivis d'une lettre)
    const kartMatch = content.match(/^(\d{1,2})([A-Za-zÀ-ÿ].*)$/);
    
    if (kartMatch) {
      comments.push({
        time,
        kart: kartMatch[1],
        text: kartMatch[2].trim(),
      });
    } else {
      comments.push({
        time,
        text: content,
      });
    }
  }

  console.log(`Parsed ${comments.length} individual comments`);
  return comments;
}

function parseGridHtml(html: string): Driver[] {
  const drivers: Driver[] = [];
  
  console.log('Parsing grid HTML, length:', html.length);
  
  // Match all tr rows with data-id and data-pos
  const rowRegex = /<tr[^>]*data-id="r(\d+)"[^>]*data-pos="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowId = rowMatch[1];
    const dataPos = rowMatch[2];
    const rowHtml = rowMatch[3];
    
    // Skip header (r0 or data-pos="0" or class="head")
    if (rowId === '0' || dataPos === '0' || rowMatch[0].includes('class="head"')) {
      continue;
    }
    
    const driver: Driver = {
      driverId: rowId,  // Stocker l'ID pour l'API détails
      position: dataPos,
      kart: '',
      team: '',
      s1: '', s2: '', s3: '',
      lastLap: '', bestLap: '', gap: '', interval: '',
      laps: '', onTrack: '', pits: '', penalty: '',
    };
    
    // ===== POSITION (c2) - in <p> =====
    const posMatch = rowHtml.match(/<p[^>]*data-id="r\d+c2"[^>]*>(\d+)<\/p>/i);
    if (posMatch) driver.position = posMatch[1];
    
    // ===== KART NUMBER (c3) - in <div> =====
    const kartMatch = rowHtml.match(/data-id="r\d+c3"[^>]*>(\d+)<\/div>/i);
    if (kartMatch) driver.kart = kartMatch[1];
    
    // ===== TEAM/DRIVER NAME (c4) - class="drteam" =====
    // Format: "BERGER Sébastien [1:16]" - remove [time]
    const teamMatch = rowHtml.match(/data-id="r\d+c4"[^>]*>([^<]+)<\/td>/i);
    if (teamMatch) {
      driver.team = teamMatch[1].replace(/\s*\[[^\]]*\]\s*$/, '').trim();
    }
    
    // ===== GAP (c5) - class="ib" =====
    const gapMatch = rowHtml.match(/data-id="r\d+c5"[^>]*>([^<]*)<\/td>/i);
    if (gapMatch) driver.gap = gapMatch[1].trim();
    
    // ===== INTERVAL (c6) =====
    const intervalMatch = rowHtml.match(/data-id="r\d+c6"[^>]*>([^<]*)<\/td>/i);
    if (intervalMatch) driver.interval = intervalMatch[1].trim();
    
    // ===== S1 (c7) =====
    const s1Match = rowHtml.match(/data-id="r\d+c7"[^>]*>([^<]*)<\/td>/i);
    if (s1Match) driver.s1 = s1Match[1].trim();
    
    // ===== S2 (c8) =====
    const s2Match = rowHtml.match(/data-id="r\d+c8"[^>]*>([^<]*)<\/td>/i);
    if (s2Match) driver.s2 = s2Match[1].trim();
    
    // ===== S3 (c9) =====
    const s3Match = rowHtml.match(/data-id="r\d+c9"[^>]*>([^<]*)<\/td>/i);
    if (s3Match) driver.s3 = s3Match[1].trim();
    
    // ===== LAST LAP (c10) =====
    const lastLapMatch = rowHtml.match(/data-id="r\d+c10"[^>]*>([^<]*)<\/td>/i);
    if (lastLapMatch) driver.lastLap = lastLapMatch[1].trim();
    
    // ===== BEST LAP (c11) =====
    const bestLapMatch = rowHtml.match(/data-id="r\d+c11"[^>]*>([^<]*)<\/td>/i);
    if (bestLapMatch) driver.bestLap = bestLapMatch[1].trim();
    
    // ===== ON TRACK (c12) =====
    const onTrackMatch = rowHtml.match(/data-id="r\d+c12"[^>]*>([^<]*)<\/td>/i);
    if (onTrackMatch) driver.onTrack = onTrackMatch[1].trim();
    
    // ===== PITS (c13) =====
    const pitsMatch = rowHtml.match(/data-id="r\d+c13"[^>]*>([^<]*)<\/td>/i);
    if (pitsMatch) driver.pits = pitsMatch[1].trim();
    
    // ===== PENALTY (c14) =====
    const penaltyMatch = rowHtml.match(/data-id="r\d+c14"[^>]*>([^<]*)<\/td>/i);
    if (penaltyMatch) driver.penalty = penaltyMatch[1].trim();
    
    if (driver.kart || driver.team) {
      drivers.push(driver);
      console.log(`Driver: P${driver.position} K${driver.kart} "${driver.team}" S1:${driver.s1} S2:${driver.s2} S3:${driver.s3} Last:${driver.lastLap}`);
    }
  }
  
  console.log(`Total drivers parsed: ${drivers.length}`);
  
  return drivers.sort((a, b) => parseInt(a.position || '999') - parseInt(b.position || '999'));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { circuitId } = await req.json();
    console.log(`Apex Live request for circuit: ${circuitId}`);
    
const circuits: Record<string, { host: string; wsPort: number; name: string }> = {
      'rkc': { host: 'www.apex-timing.com', wsPort: 7913, name: 'Racing Kart Cormeilles' },  // configPort 7910 + 3
      'rko-angerville': { host: 'www.apex-timing.com', wsPort: 8953, name: 'RKO Angerville' },  // configPort 8950 + 3
      'lemans-karting': { host: 'www.apex-timing.com', wsPort: 8953, name: 'Le Mans Karting' },
      'paris-kart': { host: 'www.apex-timing.com', wsPort: 8953, name: 'Paris Kart Indoor' },
    };
    
    const circuit = circuits[circuitId];
    if (!circuit) {
      console.log(`Circuit not found: ${circuitId}. Available: ${Object.keys(circuits).join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: 'Circuit non trouvé', 
          availableCircuits: Object.keys(circuits),
          status: 'ERROR' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const wsUrl = `wss://${circuit.host}:${circuit.wsPort}/`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    const data: ApexData = {
      circuit: circuit.name,
      session: '',
      timestamp: new Date().toISOString(),
      drivers: [],
      comments: [],
      raceTimeRemaining: 0,
      status: 'CONNECTING',
    };

    try {
      const ws = new WebSocket(wsUrl);
      
      const result = await new Promise<ApexData>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('WebSocket timeout after 10s');
          ws.close();
          data.status = 'TIMEOUT';
          resolve(data);
        }, 10000);

        ws.onopen = () => {
          console.log('WebSocket connected');
          data.status = 'CONNECTED';
        };

        ws.onmessage = (event) => {
          const message = event.data.toString();
          console.log(`Received message: ${message.substring(0, 200)}...`);
          
          const lines = message.split('\n');
          
          lines.forEach((line: string) => {
            if (!line.trim()) return;
            
            const parts = line.split('|');
            const cmd = parts[0];
            const subCmd = parts[1] || '';
            const val = parts[2] || parts[1] || '';
            
            switch(cmd) {
              case 'title1':
                data.circuit = val || data.circuit;
                console.log(`Circuit name: ${data.circuit}`);
                break;
              case 'title2':
                data.session = val;
                console.log(`Session name: ${data.session}`);
                break;
              case 'com':
                data.comments = parseComments(val);
                console.log(`Parsed ${data.comments.length} comments`);
                break;
              case 'dyn1':
                // Capture race time remaining from countdown
                if (subCmd === 'countdown') {
                  data.raceTimeRemaining = parseInt(parts[2]) || 0;
                  console.log(`Race time remaining: ${data.raceTimeRemaining}ms = ${Math.floor(data.raceTimeRemaining / 60000)}min`);
                }
                break;
              case 'grid':
                console.log(`Received grid HTML: ${val.length} bytes`);
                data.drivers = parseGridHtml(val);
                console.log(`Parsed ${data.drivers.length} drivers`);
                // Got the grid, we can resolve
                clearTimeout(timeout);
                ws.close();
                resolve(data);
                break;
            }
          });
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(timeout);
          data.status = 'ERROR';
          resolve(data);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          clearTimeout(timeout);
          if (data.drivers.length === 0 && data.status !== 'ERROR' && data.status !== 'TIMEOUT') {
            data.status = 'NO_DATA';
          }
          resolve(data);
        };
      });

      console.log(`Returning ${result.drivers.length} drivers with status: ${result.status}`);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (wsError) {
      console.error('WebSocket connection failed:', wsError);
      data.status = 'ERROR';
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, status: 'ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
