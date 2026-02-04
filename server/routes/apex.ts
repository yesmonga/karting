import { Router } from 'express';
import WebSocket from 'ws';

const router = Router();

// ============== APEX LIVE DATA ==============

interface Driver {
    driverId: string;
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
    raceTimeRemaining: number;
    status: 'CONNECTING' | 'CONNECTED' | 'TIMEOUT' | 'ERROR' | 'NO_DATA';
}

function parseComments(html: string): Comment[] {
    const comments: Comment[] = [];
    if (!html || html.trim() === '') return comments;

    const cleanHtml = html.replace(/<\/?p>/gi, '');
    const blocks = cleanHtml.split(/<b>/i).filter(b => b.trim());

    for (const block of blocks) {
        const match = block.match(/^(\d{1,2}:\d{2})<\/b>(.*)$/is);
        if (!match) continue;

        const time = match[1];
        let content = match[2].trim().replace(/<[^>]+>/g, '').trim();
        if (!content) continue;

        const kartMatch = content.match(/^(\d{1,2})([A-Za-zÀ-ÿ].*)$/);
        if (kartMatch) {
            comments.push({ time, kart: kartMatch[1], text: kartMatch[2].trim() });
        } else {
            comments.push({ time, text: content });
        }
    }
    return comments;
}

function parseGridHtml(html: string): Driver[] {
    const drivers: Driver[] = [];
    // Regex plus souple qui cherche juste les tr avec data-id="r..."
    const rowRegex = /<tr[^>]*data-id="r(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
        const rowId = rowMatch[1];
        const rowHtml = rowMatch[2];

        // Ignorer les headers ou templates (souvent id=0)
        if (rowId === '0' || rowHtml.includes('class="head"')) continue;

        let dataPos = '99';
        const posAttrMatch = rowMatch[0].match(/data-pos="(\d+)"/);
        if (posAttrMatch) dataPos = posAttrMatch[1];

        const driver: Driver = {
            driverId: rowId,
            position: dataPos,
            kart: '', team: '', s1: '', s2: '', s3: '',
            lastLap: '', bestLap: '', gap: '', interval: '',
            laps: '', onTrack: '', pits: '', penalty: '',
        };

        // Parse fields
        const posMatch = rowHtml.match(/<p[^>]*data-id="r\d+c2"[^>]*>(\d+)<\/p>/i);
        if (posMatch) driver.position = posMatch[1];

        const kartMatch = rowHtml.match(/data-id="r\d+c3"[^>]*>(\d+)<\/div>/i);
        if (kartMatch) driver.kart = kartMatch[1];

        const teamMatch = rowHtml.match(/data-id="r\d+c4"[^>]*>([^<]+)<\/td>/i);
        if (teamMatch) driver.team = teamMatch[1].replace(/\s*\[[^\]]*\]\s*$/, '').trim();

        const gapMatch = rowHtml.match(/data-id="r\d+c5"[^>]*>([^<]*)<\/td>/i);
        if (gapMatch) driver.gap = gapMatch[1].trim();

        const intervalMatch = rowHtml.match(/data-id="r\d+c6"[^>]*>([^<]*)<\/td>/i);
        if (intervalMatch) driver.interval = intervalMatch[1].trim();

        const s1Match = rowHtml.match(/data-id="r\d+c7"[^>]*>([^<]*)<\/td>/i);
        if (s1Match) driver.s1 = s1Match[1].trim();

        const s2Match = rowHtml.match(/data-id="r\d+c8"[^>]*>([^<]*)<\/td>/i);
        if (s2Match) driver.s2 = s2Match[1].trim();

        const s3Match = rowHtml.match(/data-id="r\d+c9"[^>]*>([^<]*)<\/td>/i);
        if (s3Match) driver.s3 = s3Match[1].trim();

        const lastLapMatch = rowHtml.match(/data-id="r\d+c10"[^>]*>([^<]*)<\/td>/i);
        if (lastLapMatch) driver.lastLap = lastLapMatch[1].trim();

        const bestLapMatch = rowHtml.match(/data-id="r\d+c11"[^>]*>([^<]*)<\/td>/i);
        if (bestLapMatch) driver.bestLap = bestLapMatch[1].trim();

        const onTrackMatch = rowHtml.match(/data-id="r\d+c12"[^>]*>([^<]*)<\/td>/i);
        if (onTrackMatch) driver.onTrack = onTrackMatch[1].trim();

        const pitsMatch = rowHtml.match(/data-id="r\d+c13"[^>]*>([^<]*)<\/td>/i);
        if (pitsMatch) driver.pits = pitsMatch[1].trim();

        const penaltyMatch = rowHtml.match(/data-id="r\d+c14"[^>]*>([^<]*)<\/td>/i);
        if (penaltyMatch) driver.penalty = penaltyMatch[1].trim();

        // Add laps if available
        const lapsMatch = rowHtml.match(/data-id="r\d+c\d+"[^>]*class="[^"]*laps[^"]*"[^>]*>(\d+)<\/td>/i);
        if (lapsMatch) driver.laps = lapsMatch[1];

        if (driver.kart || driver.team) {
            drivers.push(driver);
        }
    }

    return drivers.sort((a, b) => parseInt(a.position || '999') - parseInt(b.position || '999'));
}

// POST /api/apex/live
router.post('/live', async (req, res) => {
    try {
        const { circuitId, sessionId } = req.body;
        console.log(`Apex Live request for circuit: ${circuitId}, session: ${sessionId || 'none'}`);

        const circuits: Record<string, { host: string; wsPort: number; name: string }> = {
            'rkc': { host: 'www.apex-timing.com', wsPort: 7913, name: 'Racing Kart Cormeilles' },
            'rko-angerville': { host: 'www.apex-timing.com', wsPort: 8953, name: 'RKO Angerville' },
            'lemans-karting': { host: 'www.apex-timing.com', wsPort: 8953, name: 'Le Mans Karting' },
            'paris-kart': { host: 'www.apex-timing.com', wsPort: 8953, name: 'Paris Kart Indoor' },
            'wind-circuit': { host: 'www.apex-timing.com', wsPort: 8953, name: 'Wind Circuit (Test)' },
        };

        const circuit = circuits[circuitId];
        if (!circuit) {
            return res.status(400).json({
                error: 'Circuit non trouvé',
                availableCircuits: Object.keys(circuits),
                status: 'ERROR'
            });
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

                ws.on('open', () => {
                    console.log('WebSocket connected');
                    data.status = 'CONNECTED';
                });

                ws.on('message', (rawData) => {
                    const message = rawData.toString();
                    const lines = message.split('\n');

                    lines.forEach((line: string) => {
                        if (!line.trim()) return;

                        const parts = line.split('|');
                        const cmd = parts[0];
                        const subCmd = parts[1] || '';
                        const val = parts[2] || parts[1] || '';

                        switch (cmd) {
                            case 'title1':
                                data.circuit = val || data.circuit;
                                break;
                            case 'title2':
                                data.session = val;
                                break;
                            case 'com':
                                data.comments = parseComments(val);
                                break;
                            case 'dyn1':
                                if (subCmd === 'countdown') {
                                    data.raceTimeRemaining = parseInt(parts[2]) || 0;
                                }
                                break;
                            case 'grid':
                                console.log(`Received grid (length: ${val.length})`);
                                if (val.length < 100) console.log('Grid preview:', val);

                                data.drivers = parseGridHtml(val);
                                console.log(`Parsed ${data.drivers.length} drivers`);

                                // Resolve if we have drivers OR if it's been a few seconds and we have other data
                                if (data.drivers.length > 0) {
                                    clearTimeout(timeout);
                                    ws.close();
                                    resolve(data);
                                }
                                break;
                        }
                    });
                });

                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    clearTimeout(timeout);
                    data.status = 'ERROR';
                    resolve(data);
                });

                ws.on('close', () => {
                    console.log('WebSocket closed');
                    clearTimeout(timeout);
                    if (data.drivers.length === 0 && data.status !== 'ERROR' && data.status !== 'TIMEOUT') {
                        data.status = 'NO_DATA';
                    }
                    resolve(data);
                });
            });

            res.json(result);
        } catch (wsError) {
            console.error('WebSocket connection failed:', wsError);
            data.status = 'ERROR';
            res.json(data);
        }
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ error: String(error), status: 'ERROR' });
    }
});

// ============== APEX TEAM DETAILS ==============

interface LapData {
    lapNumber: number;
    s1: number;
    s2: number;
    s3: number;
    total: number;
    s1Best: boolean;
    s2Best: boolean;
    s3Best: boolean;
    totalBest: boolean;
    isPit: boolean;
}

interface DriverInfo {
    id: string;
    num: string;
    name: string;
    isCurrent: boolean;
}

function parseLapLine(line: string): LapData | null {
    const match = line.match(/\.L(\d+)#([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)/);
    if (!match) return null;

    const lapNumber = parseInt(match[1]);
    if (lapNumber === 0) return null;

    const parseTime = (str: string) => {
        const isBest = str.startsWith('g');
        const isPit = str.startsWith('p');
        const time = parseInt(str.replace(/^[gp]/, '')) || 0;
        return { time, isBest, isPit };
    };

    const s1 = parseTime(match[2]);
    const s2 = parseTime(match[3]);
    const s3 = parseTime(match[4]);
    const total = parseTime(match[5]);

    return {
        lapNumber,
        s1: s1.time, s2: s2.time, s3: s3.time, total: total.time,
        s1Best: s1.isBest, s2Best: s2.isBest, s3Best: s3.isBest,
        totalBest: total.isBest, isPit: s1.isPit || total.isPit,
    };
}

function parseDriverInfo(xml: string) {
    const result = {
        teamName: '', kartNumber: '', club: '', color: '',
        drivers: [] as DriverInfo[], currentDriver: null as DriverInfo | null,
    };

    const teamMatch = xml.match(/<driver[^>]*id="(\d+)"[^>]*num="(\d+)"[^>]*name="([^"]+)"[^>]*color="([^"]*)"/);
    if (teamMatch) {
        result.kartNumber = teamMatch[2];
        result.teamName = teamMatch[3];
        result.color = teamMatch[4];
    }

    const clubMatch = xml.match(/type="club"[^>]*value="([^"]+)"/);
    if (clubMatch) result.club = clubMatch[1];

    const driverRegex = /<driver\s+id="(\d+)"[^>]*num="(\d+)"[^>]*name="([^"]+)"[^>]*(?:current="(\d+)")?[^/]*\/>/gi;
    let driverMatch;

    while ((driverMatch = driverRegex.exec(xml)) !== null) {
        const driver: DriverInfo = {
            id: driverMatch[1], num: driverMatch[2], name: driverMatch[3],
            isCurrent: driverMatch[0].includes('current="1"'),
        };
        result.drivers.push(driver);
        if (driver.isCurrent) result.currentDriver = driver;
    }

    return result;
}

// POST /api/apex/team-details
router.post('/team-details', async (req, res) => {
    try {
        const { circuitId, driverId } = req.body;
        console.log(`Fetching team details for circuit: ${circuitId}, driver: ${driverId}`);

        const circuits: Record<string, number> = {
            'rkc': 7910,
            'rko-angerville': 8950,
            'lemans-karting': 8950,
            'paris-kart': 8950,
        };

        const port = circuits[circuitId];
        if (!port) {
            return res.status(400).json({ error: 'Circuit non trouvé' });
        }

        const request = `D#-30#D${driverId}.L#-999#D${driverId}.B#1#D${driverId}.INF`;

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
        const lines = text.split('\n').filter(l => l.trim());

        const laps: LapData[] = [];
        let bestLap = { s1: 0, s2: 0, s3: 0, total: 0 };
        let bestSectors = { s1: 0, s2: 0, s3: 0 };
        let driverInfo = { teamName: '', kartNumber: '', club: '', color: '', drivers: [] as DriverInfo[], currentDriver: null as DriverInfo | null };

        for (const line of lines) {
            if (line.includes('.L00') || line.match(/\.L\d{4}#/)) {
                const lap = parseLapLine(line);
                if (lap && lap.lapNumber > 0) laps.push(lap);
            } else if (line.includes('.BL#')) {
                const match = line.match(/\.BL#(\d+)\|(\d+)\|(\d+)\|(\d+)/);
                if (match) {
                    bestLap = { s1: parseInt(match[1]), s2: parseInt(match[2]), s3: parseInt(match[3]), total: parseInt(match[4]) };
                }
            } else if (line.includes('.BS#')) {
                const match = line.match(/\.BS#(\d+)\|(\d+)\|(\d+)/);
                if (match) {
                    bestSectors = { s1: parseInt(match[1]), s2: parseInt(match[2]), s3: parseInt(match[3]) };
                }
            } else if (line.includes('.INF#')) {
                driverInfo = parseDriverInfo(line.split('.INF#')[1] || '');
            }
        }

        laps.sort((a, b) => b.lapNumber - a.lapNumber);

        res.json({
            teamId: driverId,
            teamName: driverInfo.teamName,
            kartNumber: driverInfo.kartNumber,
            club: driverInfo.club,
            color: driverInfo.color,
            currentLap: laps[0]?.lapNumber || 0,
            currentDriver: driverInfo.currentDriver,
            drivers: driverInfo.drivers,
            laps,
            bestLap,
            bestSectors,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: String(error) });
    }
});

export default router;
