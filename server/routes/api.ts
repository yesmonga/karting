import { Router } from 'express';
import { query, queryOne } from '../db.js';

const router = Router();

// ============== TEAMS ==============

// Get all teams
router.get('/teams', async (req, res) => {
    try {
        const teams = await query('SELECT * FROM teams ORDER BY name');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Create team
router.post('/teams', async (req, res) => {
    try {
        const { name, user_id } = req.body;
        const team = await queryOne(
            'INSERT INTO teams (name, user_id) VALUES ($1, $2) RETURNING *',
            [name, user_id || 'anonymous']
        );
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// ============== DRIVERS ==============

// Get all drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await query('SELECT * FROM drivers ORDER BY name');
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Create driver
router.post('/drivers', async (req, res) => {
    try {
        const { name, code, color, weight_kg, full_name, team_id } = req.body;

        // Get or create default team
        let finalTeamId = team_id;
        if (!finalTeamId) {
            const defaultTeam = await queryOne(
                "SELECT id FROM teams WHERE id = '00000000-0000-0000-0000-000000000001'"
            );
            if (defaultTeam) {
                finalTeamId = defaultTeam.id;
            } else {
                const newTeam = await queryOne(
                    "INSERT INTO teams (name, user_id) VALUES ('Mon Équipe', 'anonymous') RETURNING id"
                );
                finalTeamId = newTeam?.id;
            }
        }

        const driver = await queryOne(
            `INSERT INTO drivers (name, code, color, weight_kg, full_name, team_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name.toUpperCase(), code || name.slice(0, 3).toUpperCase(), color || '#3B82F6', weight_kg, full_name, finalTeamId]
        );
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, color, weight_kg, full_name } = req.body;
        const driver = await queryOne(
            `UPDATE drivers SET 
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        color = COALESCE($3, color),
        weight_kg = COALESCE($4, weight_kg),
        full_name = COALESCE($5, full_name)
       WHERE id = $6 RETURNING *`,
            [name?.toUpperCase(), code?.toUpperCase(), color, weight_kg, full_name, id]
        );
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Delete driver
router.delete('/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM drivers WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// ============== RACES ==============

// Get all races with team info
router.get('/races', async (req, res) => {
    try {
        const races = await query(`
      SELECT r.*, t.name as team_name 
      FROM races r 
      LEFT JOIN teams t ON r.team_id = t.id 
      ORDER BY r.date DESC NULLS LAST
    `);
        res.json(races);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Create race with laps and stints
router.post('/races', async (req, res) => {
    try {
        const { name, date, track_name, ballast_target_kg, kart_number, position, total_karts,
            best_lap_ms, best_lap_number, total_laps, team_id, laps, pit_stops, stints } = req.body;

        // Create race
        const race = await queryOne(
            `INSERT INTO races (name, date, track_name, ballast_target_kg, kart_number, position, 
        total_karts, best_lap_ms, best_lap_number, total_laps, team_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, date, track_name, ballast_target_kg || 80, kart_number, position,
                total_karts, best_lap_ms, best_lap_number, total_laps, team_id]
        );

        if (!race) throw new Error('Failed to create race');

        // Insert laps
        if (laps && laps.length > 0) {
            for (const lap of laps) {
                await query(
                    'INSERT INTO race_laps (race_id, lap_number, lap_time_ms) VALUES ($1, $2, $3)',
                    [race.id, lap.lap_number, lap.lap_time_ms]
                );
            }
        }

        // Insert pit stops
        if (pit_stops && pit_stops.length > 0) {
            for (const pit of pit_stops) {
                await query(
                    'INSERT INTO pit_stops (race_id, lap_number, duration_ms) VALUES ($1, $2, $3)',
                    [race.id, pit.lap_number, pit.duration_ms]
                );
            }
        }

        // Insert stints
        if (stints && stints.length > 0) {
            for (const stint of stints) {
                await query(
                    `INSERT INTO stints (race_id, driver_id, stint_number, start_lap, end_lap, 
            best_lap_ms, avg_lap_ms, total_laps) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [race.id, stint.driver_id, stint.stint_number, stint.start_lap, stint.end_lap,
                    stint.best_lap_ms, stint.avg_lap_ms, stint.total_laps]
                );
            }
        }

        res.json(race);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Get race with laps
router.get('/races/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const race = await queryOne('SELECT * FROM races WHERE id = $1', [id]);
        if (!race) return res.status(404).json({ error: 'Race not found' });

        const laps = await query('SELECT * FROM race_laps WHERE race_id = $1 ORDER BY lap_number', [id]);
        const pitStops = await query('SELECT * FROM pit_stops WHERE race_id = $1 ORDER BY lap_number', [id]);
        const stints = await query('SELECT * FROM stints WHERE race_id = $1 ORDER BY stint_number', [id]);

        res.json({ ...race, laps, pit_stops: pitStops, stints });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// ============== LIVE SESSIONS ==============

// Get live session by ID
router.get('/live-sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await queryOne('SELECT * FROM live_sessions WHERE id = $1', [id]);
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Get latest session for user
router.get('/live-sessions/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const session = await queryOne(
            'SELECT * FROM live_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
            [userId]
        );
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Create or update live session
router.post('/live-sessions', async (req, res) => {
    try {
        const { id, user_id, circuit_id, config, selected_kart, selected_team, stints, race_start_time } = req.body;

        if (id) {
            // Update existing
            const session = await queryOne(
                `UPDATE live_sessions SET 
          config = $1, selected_kart = $2, selected_team = $3, 
          stints = $4, race_start_time = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
                [JSON.stringify(config), selected_kart, selected_team, JSON.stringify(stints), race_start_time, id]
            );
            res.json(session);
        } else {
            // Create new
            const session = await queryOne(
                `INSERT INTO live_sessions (user_id, circuit_id, config, selected_kart, selected_team, stints, race_start_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [user_id || 'anonymous', circuit_id, JSON.stringify(config), selected_kart, selected_team, JSON.stringify(stints), race_start_time]
            );
            res.json(session);
        }
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Update stints only
router.patch('/live-sessions/:id/stints', async (req, res) => {
    try {
        const { id } = req.params;
        const { stints } = req.body;
        const session = await queryOne(
            'UPDATE live_sessions SET stints = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [JSON.stringify(stints), id]
        );
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// ============== ONBOARD MESSAGES ==============

// Create onboard message
router.post('/onboard-messages', async (req, res) => {
    try {
        const { session_id, kart_number, text } = req.body;
        const message = await queryOne(
            'INSERT INTO onboard_messages (session_id, kart_number, text) VALUES ($1, $2, $3) RETURNING *',
            [session_id, kart_number, text]
        );
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Get messages for session
router.get('/onboard-messages/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await query(
            'SELECT * FROM onboard_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 50',
            [sessionId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Get latest message for kart (fallback)
router.get('/onboard-messages/kart/:kartNumber/latest', async (req, res) => {
    try {
        const { kartNumber } = req.params;
        const messages = await query(
            'SELECT * FROM onboard_messages WHERE kart_number = $1 ORDER BY created_at DESC LIMIT 1',
            [kartNumber]
        );
        res.json(messages); // Returns array with 0 or 1 item
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

export default router;
