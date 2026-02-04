import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApexDriverData {
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

interface ApexComment {
  time: string;
  kart: string;
  text: string;
}

interface ApexLiveData {
  circuit: string;
  session: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  timestamp: string;
  drivers: ApexDriverData[];
  comments: ApexComment[];
}

function parseApexHtml(html: string): ApexLiveData {
  const result: ApexLiveData = {
    circuit: '',
    session: '',
    status: 'DISCONNECTED',
    timestamp: new Date().toISOString(),
    drivers: [],
    comments: []
  };

  // Extract title/circuit name
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    result.circuit = titleMatch[1].trim();
  }

  // Look for data-id="title1" and data-id="title2"
  const title1Match = html.match(/data-id="title1"[^>]*>([^<]*)</i);
  const title2Match = html.match(/data-id="title2"[^>]*>([^<]*)</i);
  if (title1Match) result.circuit = title1Match[1].trim() || result.circuit;
  if (title2Match) result.session = title2Match[1].trim();

  // Check connection status
  const isConnected = html.includes('CONNECTED') || !html.includes('DISCONNECTED');
  result.status = isConnected ? 'CONNECTED' : 'DISCONNECTED';

  // Extract drivers from the timing grid
  // Look for table rows with timing data
  const rowRegex = /<tr[^>]*class="(?:odd|even|[^"]*)"[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Skip header rows
    if (rowHtml.includes('class="head"')) continue;

    const driver: ApexDriverData = {
      position: '',
      kart: '',
      team: '',
      s1: '',
      s2: '',
      s3: '',
      lastLap: '',
      bestLap: '',
      gap: '',
      interval: '',
      laps: '',
      onTrack: '',
      pits: '',
      penalty: ''
    };

    // Extract cells with data-type attributes
    const cellRegex = /<td[^>]*data-type="([^"]*)"[^>]*(?:class="([^"]*)")?[^>]*>([^<]*)<\/td>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const dataType = cellMatch[1];
      const className = cellMatch[2] || '';
      let text = cellMatch[3].trim();

      // Add color indicators for sectors
      if (className.includes('purple') || className.includes('best')) {
        text = '🟣' + text;
      } else if (className.includes('green') || className.includes('pb')) {
        text = '🟢' + text;
      }

      switch(dataType) {
        case 'rk': driver.position = text; break;
        case 'no': driver.kart = text; break;
        case 'dr': driver.team = text; break;
        case 'te': driver.team = text; break;
        case 's1': driver.s1 = text; break;
        case 's2': driver.s2 = text; break;
        case 's3': driver.s3 = text; break;
        case 'llp': driver.lastLap = text; break;
        case 'blp': driver.bestLap = text; break;
        case 'gap': driver.gap = text; break;
        case 'int': driver.interval = text; break;
        case 'tlp': driver.laps = text; break;
        case 'olp': driver.onTrack = text; break;
        case 'pit': driver.pits = text; break;
        case 'pena': driver.penalty = text; break;
      }
    }

    // Also try simpler cell extraction for alternative HTML structure
    if (!driver.kart && !driver.team) {
      const simpleCellRegex = /<td[^>]*>([^<]*)<\/td>/gi;
      const cells: string[] = [];
      let simpleMatch;
      while ((simpleMatch = simpleCellRegex.exec(rowHtml)) !== null) {
        cells.push(simpleMatch[1].trim());
      }
      
      // Typical order: position, kart, team, s1, s2, s3, lastLap, bestLap, gap, laps, onTrack, pits
      if (cells.length >= 6) {
        driver.position = cells[0] || driver.position;
        driver.kart = cells[1] || driver.kart;
        driver.team = cells[2] || driver.team;
        // Continue with other fields if needed
      }
    }

    if (driver.team || driver.kart) {
      result.drivers.push(driver);
    }
  }

  // Sort by position
  result.drivers.sort((a, b) => {
    const posA = parseInt(a.position) || 999;
    const posB = parseInt(b.position) || 999;
    return posA - posB;
  });

  // Extract comments (penalties, warnings, etc.)
  const commentPatterns = [
    /(\d{2}:\d{2})\s*(\d+)?\s*(SUPPRESSION[^\n<]+)/gi,
    /(\d{2}:\d{2})\s*(\d+)?\s*(Avertissement[^\n<]+)/gi,
    /(\d{2}:\d{2})\s*(\d+)?\s*(Pénalité[^\n<]+)/gi,
    /(\d{2}:\d{2})\s*(\d+)?\s*(Passage au stand[^\n<]+)/gi
  ];

  for (const pattern of commentPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const time = match[1];
      const kart = match[2] || '';
      const message = match[3]?.trim();
      if (message && !message.match(/^\d+$/)) {
        result.comments.push({
          time,
          kart,
          text: message
        });
      }
    }
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Apex Timing data from: ${url}`);

    // Fetch the Apex Timing page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Received HTML: ${html.length} bytes`);

    const data = parseApexHtml(html);
    console.log(`Parsed ${data.drivers.length} drivers, ${data.comments.length} comments`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
